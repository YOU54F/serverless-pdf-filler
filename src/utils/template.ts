import {
  asPDFName,
  degrees,
  drawText,
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
  StandardFonts,
  rgb,
} from "pdf-lib";
import pino from "pino";
import { PdfInputValues } from "..";
import { writeFileSync } from "fs";
const dest = pino.destination({ sync: false });

const logger = pino(dest).child({
  serviceName: "serverless-pdf-filler",
});

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
    const pdfDoc = await PDFDocument.load(
      pdfDocument as string | Uint8Array | ArrayBuffer
    );
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    logger.info("Processing form values and injecting into PDF");
    Object.entries(formValues).forEach(async (entry) => {
      await findAndFillInField(
        pdfDoc,
        entry[0],
        entry[1] as string,
        helveticaFont
      );
    });
    logger.info("Filled PDF succcessfully, locking fields");
    const acroFields: PDFDict[] = getAcroFields(pdfDoc);
    acroFields.forEach((field) => lockField(field));
    logger.info("Locked fields succcessfully, saving PDF");
    const pdfBytes = await pdfDoc.save();
    logger.info("Writing filled PDF out to file");
    writeFileSync(`tmp/filled_${templateName}`, pdfBytes);
    const result: TemplateServiceResult = { result: true };
    return result;
  } catch (e) {
    const result: TemplateServiceResult = { result: false, error: e.toString() };
    return result;
  }
};

export const fillInField = (
  pdfDoc: PDFDocument,
  fieldName: string,
  text: string,
  font: PDFFont
) => {
  try {
    logger.info({ fieldName }, "Populating form field with supplied value");
    const field = findAcroFieldByName(pdfDoc, fieldName);
    if (field) fillAcroTextField(field, text, font);
  } catch (e) {
    logger.error({ error: e }, "fillInField");
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
    logger.error({ error: e }, "lockField");
    return e;
  }
};

export const getAcroForm = (pdfDoc: PDFDocument) =>
  pdfDoc.catalog.lookupMaybe(PDFName.of("AcroForm"), PDFDict);

export const findAcroFieldByName = (pdfDoc: PDFDocument, name: string) => {
  try {
    const acroFields = getAcroFields(pdfDoc);

    return acroFields.find((acroField) => {
      const fieldName = acroField.get(PDFName.of("T"));

      return (
        (fieldName instanceof PDFString || fieldName instanceof PDFHexString) &&
        fieldName.decodeText() === name
      );
    });
  } catch (e) {
    logger.error({ error: e }, "findAcroFieldByName");
    return e;
  }
};

export const fillAcroTextField = (
  acroField: PDFDict,
  text: string,
  font: PDFFont
) => {
  try {
    const rect = acroField.lookup(PDFName.of("Rect"), PDFArray);
    const width =
      rect.lookup(2, PDFNumber).value() - rect.lookup(0, PDFNumber).value();
    const height =
      rect.lookup(3, PDFNumber).value() - rect.lookup(1, PDFNumber).value();

    const N = singleLineAppearanceStream(font, text, width, height);

    acroField.set(PDFName.of("AP"), acroField.context.obj({ N }));
    acroField.set(PDFName.of("Ff"), PDFNumber.of(1 /* Read Only */));
    acroField.set(PDFName.of("V"), PDFHexString.fromText(text));
  } catch (e) {
    logger.error({ error: e }, "fillAcroTextField");
    return e;
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
    logger.error({ error: e }, "getAcroFields");
    return e;
  }
};

const beginMarkedContent = (tag: string) =>
  PDFOperator.of(Ops.BeginMarkedContent, [asPDFName(tag)]);

const endMarkedContent = () => PDFOperator.of(Ops.EndMarkedContent);

const singleLineAppearanceStream = (
  font: PDFFont,
  text: string,
  width: number,
  height: number
) => {
  try {
    const size = font.sizeAtHeight(height - 5);
    const encodedText = font.encodeText(text);
    const x = 0;
    const y = height - size;

    return textFieldAppearanceStream(
      font,
      size,
      encodedText,
      x,
      y,
      width,
      height
    );
  } catch (e) {
    logger.error({ error: e }, "singleLineAppearanceStream");
    return e;
  }
};

const textFieldAppearanceStream = (
  font: PDFFont,
  size: number,
  encodedText: PDFHexString,
  x: number,
  y: number,
  width: number,
  height: number
) => {
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
      ...drawText(encodedText, {
        color: rgb(0, 0, 0),
        font: "F0",
        size,
        rotate: degrees(0),
        xSkew: degrees(0),
        ySkew: degrees(0),
        x,
        y,
      }),
      popGraphicsState(),
      endMarkedContent(),
    ];

    const stream = PDFContentStream.of(dict, operators);

    return font.doc.context.register(stream);
  } catch (e) {
    logger.error({ error: e }, "textFieldAppearanceStream");
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
    logger.error({ error: e }, "getRootAcroFields");
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
    logger.error({ error: e }, "recurseAcroFieldKids");
    return e;
  }
};

export const findAndFillInField = (
  pdfDoc: PDFDocument,
  fieldName: string,
  text: string,
  font: PDFFont
) => {
  try {
    findAndFillAcroFieldByName(pdfDoc, fieldName, font, text);
  } catch (e) {
    logger.error({ error: e }, "findAndFillInField");
    return e;
  }
};

export const findAndFillAcroFieldByName = (
  pdfDoc: PDFDocument,
  name: string,
  font: PDFFont,
  text: string
) => {
  try {
    logger.info(`findAcroFieldByName is looking up ${name}`);
    fillAcroFieldsByName(pdfDoc, font, text, name);
  } catch (e) {
    logger.error({ error: e }, "findAndFillAcroFieldByName");
    return e;
  }
};

export const fillAcroFieldsByName = (
  pdfDoc: PDFDocument,
  font: PDFFont,
  text: string,
  name: string
) => {
  try {
    const acroForm = getAcroForm(pdfDoc);
    if (!acroForm) return [];
    // https://github.com/Hopding/pdf-lib/issues/425#issuecomment-620615779
    acroForm.set(PDFName.of("NeedAppearances"), PDFBool.True);

    const rootFields = getRootAcroFields(pdfDoc);
    if (!rootFields) return [];

    rootFields.forEach((rootField:PDFDict) => {
      fillChildFieldsByName(rootField, font, text, name);
      fillRootFieldsByName(rootField, font, text, name);
    });
  } catch (e) {
    logger.error({ error: e }, "fillAcroFieldsByName");
    return e;
  }
};

export const fillChildFieldsByName = (
  rootField: PDFDict,
  font: PDFFont,
  text: string,
  name: string
) => {
  try {
    const childFields: PDFDict[] = [];
    const fieldName = rootField.get(PDFName.of("T"));
    const hasKids = rootField.get(PDFName.of("Kids"));
    const fieldNameText = rootField
      .lookupMaybe(PDFName.of("T"), PDFString)
      ?.decodeText();
    if (hasKids && fieldNameText && fieldNameText.toString() === name) {
      childFields.push(...recurseAcroFieldKids(rootField));
      childFields.forEach((childField) => {
        const hasParent = childField.lookup(PDFName.of("Parent"));
        if (hasParent) {
          logger.info(`Found: ${fieldName} child field and filling field.`);
          fillAcroTextField(childField, text, font);
        }
      });
    }
  } catch (e) {
    logger.error({ error: e }, "fillChildFieldsByName");
    return e;
  }
};

export const fillRootFieldsByName = (
  rootField: PDFDict,
  font: PDFFont,
  text: string,
  name: string
) => {
  try {
    const fieldName = rootField.get(PDFName.of("T"));
    const hasKids = rootField.get(PDFName.of("Kids"));

    if (
      (fieldName instanceof PDFString || fieldName instanceof PDFHexString) &&
      fieldName.decodeText() === name &&
      !hasKids
    ) {
      logger.info(`Found: ${fieldName} root field and filling field.`);
      fillAcroTextField(rootField, text, font);
    }
  } catch (e) {
    logger.error({ error: e }, "fillRootFieldsByName");
    return e;
  }
};
