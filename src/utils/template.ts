import {
  asPDFName,
  degrees,
  PDFArray,
  PDFContentStream,
  PDFDict,
  PDFDocument,
  PDFFont,
  PDFHexString,
  PDFName,
  PDFBool,
  PDFNumber,
  PDFString,
  PDFOperator,
  PDFOperatorNames as Ops,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  breakTextIntoLines,
  drawLinesOfText,
} from "pdf-lib";
import pino from "pino";
import fontkit from "@pdf-lib/fontkit";
import { PdfInputValues } from "..";
import { writeFileSync } from "fs";
import fetch from "node-fetch";

export interface TemplateServiceRequest {
  pdfDocument: AWS.S3.Body;
  formValues: PdfInputValues;
  templateName: string;
  logger: pino.Logger;
}

export interface TemplateServiceResult {
  result: boolean;
  error?: string;
}

export const templateService = async ({
  pdfDocument,
  formValues,
  templateName,
  logger,
}: TemplateServiceRequest): Promise<TemplateServiceResult> => {
  try {
    const pdfDoc = await PDFDocument.load(pdfDocument as ArrayBuffer);

    const customFontBytes = await fetch(
      "https://github.com/YOU54F/arial.ttf/raw/master/arialmt.ttf"
    ).then((res) => res.arrayBuffer());

    pdfDoc.registerFontkit(fontkit);
    const font = await pdfDoc.embedFont(customFontBytes);

    pdfDoc.setCreator("Yousaf Nabi");
    pdfDoc.setProducer("Yousaf Nabi");

    logger.info("Processing form values and injecting into PDF");
    Object.entries(formValues).forEach(async (entry) => {
      await findAndFillInForm({
        pdfDoc,
        fieldName: entry[0],
        text: entry[1] as string,
        font,
        logger,
      });
    });

    const acroFields: PDFDict[] = getAcroFields(pdfDoc);
    acroFields.forEach((field) => lockField(field));

    logger.info("Locked fields succcessfully, saving PDF");
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });

    logger.info("Filled PDF succcessfully, writing to file");

    writeFileSync(`/tmp/filled_${templateName}`, pdfBytes);

    const result: TemplateServiceResult = { result: true };
    return result;
  } catch (e) {
    const result: TemplateServiceResult = {
      result: false,
      error: e.toString(),
    };
    return result;
  }
};

export const getAcroFields = (pdfDoc: PDFDocument): PDFDict[] => {
  try {
    const acroForm = getAcroForm(pdfDoc);

    if (!acroForm) return [];

    acroForm.set(PDFName.of("NeedAppearances"), PDFBool.True);

    const fieldRefs = acroForm.lookupMaybe(PDFName.of("Fields"), PDFArray);
    if (!fieldRefs) return [];

    const fields = new Array(fieldRefs.size());
    for (let idx = 0, len = fieldRefs.size(); idx < len; idx++) {
      fields[idx] = fieldRefs.lookup(idx);
    }
    return fields;
  } catch (e) {
    return e;
  }
};

export const lockField = (acroField: PDFDict) => {
  try {
    const fieldType = acroField.lookup(PDFName.of("FT"));
    if (fieldType === PDFName.of("Tx")) {
      acroField.set(PDFName.of("Ff"), PDFNumber.of(1 << 0 /* Read Only */));
    }
  } catch (e) {
    return e;
  }
};

const beginMarkedContent = (tag: string) =>
  PDFOperator.of(Ops.BeginMarkedContent, [asPDFName(tag)]);

const endMarkedContent = () => PDFOperator.of(Ops.EndMarkedContent);

const multiLineAppearanceStream = ({
  font,
  text,
  width,
  height,
}: ApprearanceStreamOptions) => {
  const size = 6;
  const textWidth = (t: string) => font.widthOfTextAtSize(t, size);
  const encodedTextLines = breakTextIntoLines(
    text,
    [" "],
    width,
    textWidth
  ).map((line: string) => font.encodeText(line));
  const x = 0;
  const y = height - size;
  return textFieldAppearanceStream({
    font,
    size,
    encodedTextLines,
    x,
    y,
    width,
    height,
  });
};
const singleLineAppearanceStream = ({
  font,
  text,
  width,
  height,
}: ApprearanceStreamOptions) => {
  try {
    const size = font.sizeAtHeight(height - 2);
    const encodedTextLines = [font.encodeText(text)];
    const x = 0;
    const y = height - size;

    return textFieldAppearanceStream({
      font,
      size,
      encodedTextLines,
      x,
      y,
      width,
      height,
    });
  } catch (e) {
    return e;
  }
};

const textFieldAppearanceStream = ({
  font,
  size,
  encodedTextLines,
  x,
  y,
  width,
  height,
}: TextFieldApprearanceStreamOptions) => {
  try {
    const dict = font.doc.context.obj({
      Type: "XObject",
      Subtype: "Form",
      FormType: 1,
      BBox: [0, 0, width, height],
      Resources: { Font: { F0: font.ref } },
    });

    const operators = [
      beginMarkedContent("Tx"),
      pushGraphicsState(),
      ...drawLinesOfText(encodedTextLines, {
        color: rgb(0, 0, 0),
        font: "F0",
        size: size,
        rotate: degrees(0),
        xSkew: degrees(0),
        ySkew: degrees(0),
        x: x,
        y: y,
        lineHeight: size + 2,
      }),
      popGraphicsState(),
      endMarkedContent(),
    ];
    const stream = PDFContentStream.of(dict, operators);

    return font.doc.context.register(stream);
  } catch (e) {
    return e;
  }
};

const getAcroForm = (pdfDoc: PDFDocument) =>
  pdfDoc.catalog.lookupMaybe(PDFName.of("AcroForm"), PDFDict);

const findAndFillInForm = ({
  pdfDoc,
  fieldName,
  text,
  font,
  logger,
}: FillFormOptions) => {
  try {
    const acroForm = getAcroForm(pdfDoc);
    if (!acroForm) return [];
    acroForm.set(PDFName.of("NeedAppearances"), PDFBool.True);

    const rootFields = getRootAcroFields(pdfDoc);
    if (!rootFields) return [];

    rootFields.forEach((acroField: PDFDict) => {
      fillChildFieldsByName({ acroField, fieldName, text, font, logger });
      fillRootFieldByName({ acroField, fieldName, text, font, logger });
    });
  } catch (e) {
    logger.error(
      { error: e, functionName: "fillAcroFieldsByName" },
      "An error occurred filling a field in the form"
    );
    return e;
  }
};

const getRootAcroFields = (pdfDoc: PDFDocument) => {
  try {
    if (!pdfDoc.catalog.get(PDFName.of("AcroForm"))) return [];
    const acroForm = pdfDoc.context.lookup(
      pdfDoc.catalog.get(PDFName.of("AcroForm")),
      PDFDict
    );

    if (!acroForm.get(PDFName.of("Fields"))) return [];
    const acroFieldRefs = acroForm.context.lookup(
      acroForm.get(PDFName.of("Fields")),
      PDFArray
    );

    const acroFields = new Array<PDFDict>(acroFieldRefs.size());
    for (let idx = 0, len = acroFieldRefs.size(); idx < len; idx++) {
      acroFields[idx] = pdfDoc.context.lookup(acroFieldRefs.get(idx), PDFDict);
    }

    return acroFields;
  } catch (e) {
    return e;
  }
};

const fillRootFieldByName = ({
  acroField,
  fieldName,
  text,
  font,
  logger,
}: FillFormFieldOptions) => {
  try {
    const formName = acroField.get(PDFName.of("T"));
    const hasKids = acroField.get(PDFName.of("Kids"));

    if (
      (formName instanceof PDFString || formName instanceof PDFHexString) &&
      formName.decodeText() === fieldName &&
      !hasKids
    ) {
      logger.info(`Found: ${formName} root field and filling field.`);
      fillAcroTextField({ acroField, text, font });
    }
  } catch (e) {
    logger.error(
      { error: e, functionName: "fillRootFieldByName" },
      "An error occurred filling a field in the form"
    );
    return e;
  }
};

const fillChildFieldsByName = ({
  acroField,
  fieldName,
  text,
  font,
  logger,
}: FillFormFieldOptions) => {
  try {
    const childFields: PDFDict[] = [];
    const formName = acroField.get(PDFName.of("T"));
    const hasKids = acroField.get(PDFName.of("Kids"));
    const formNameText = acroField
      .lookupMaybe(PDFName.of("T"), PDFString)
      ?.decodeText();
    if (hasKids && formNameText && formNameText.toString() === fieldName) {
      acroField.set(PDFName.of("V"), PDFHexString.fromText(text));
      childFields.push(...recurseAcroFieldKids(acroField));
      childFields.forEach((childField) => {
        const hasParent = childField.lookup(PDFName.of("Parent"));
        if (hasParent) {
          logger.info(`Found: ${formName} child field and filling field.`);
          fillAcroTextField({ acroField: childField, text, font });
        }
      });
    }
  } catch (e) {
    logger.error(
      { error: e, functionName: "fillChildFieldsByName" },
      "An error occurred filling a field in the form"
    );
    return e;
  }
};

const recurseAcroFieldKids = (field: PDFDict) => {
  try {
    const kids = field.lookupMaybe(PDFName.of("Kids"), PDFArray);
    if (!kids) return [field];
    const acroFields = new Array<PDFDict>(kids.size());
    for (let idx = 0, len = kids.size(); idx < len; idx++) {
      acroFields[idx] = field.context.lookup(kids.get(idx), PDFDict);
    }
    const flatKids: PDFDict[] = [];
    for (let idx = 0, len = acroFields.length; idx < len; idx++) {
      flatKids.push(...recurseAcroFieldKids(acroFields[idx]));
    }
    return flatKids;
  } catch (e) {
    return e;
  }
};

const fillAcroTextField = ({
  acroField,
  text,
  font,
  singleline = false,
}: FillAcroTextField) => {
  try {
    const rect = acroField.lookup(PDFName.of("Rect"), PDFArray);
    const width =
      rect.lookup(2, PDFNumber).value() - rect.lookup(0, PDFNumber).value();
    const height =
      rect.lookup(3, PDFNumber).value() - rect.lookup(1, PDFNumber).value();

    const N = singleline
      ? singleLineAppearanceStream({ font, text, width, height })
      : multiLineAppearanceStream({ font, text, width, height });

    acroField.set(PDFName.of("AP"), acroField.context.obj({ N }));
    acroField.set(PDFName.of("V"), PDFHexString.fromText(text));
  } catch (e) {
    return e;
  }
};

interface FillFormOptions {
  pdfDoc: PDFDocument;
  fieldName: string;
  text: string;
  font: PDFFont;
  logger: pino.Logger;
}

interface FillFormFieldOptions {
  acroField: PDFDict;
  fieldName: string;
  text: string;
  font: PDFFont;
  logger: pino.Logger;
}

interface FillAcroTextField {
  acroField: PDFDict;
  text: string;
  font: PDFFont;
  singleline?: boolean;
}

interface TextFieldApprearanceStreamOptions {
  font: PDFFont;
  size: number;
  encodedTextLines: PDFHexString[];
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ApprearanceStreamOptions {
  font: PDFFont;
  text: string;
  width: number;
  height: number;
}
