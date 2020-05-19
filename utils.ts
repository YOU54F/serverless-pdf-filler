import {
  asPDFName,
  degrees,
  drawText,
  PDFArray,
  PDFBool,
  PDFContentStream,
  PDFDict,
  PDFDocument,
  PDFFont,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFString,
  PDFOperator,
  PDFOperatorNames as Ops,
  popGraphicsState,
  pushGraphicsState,
  rgb,
} from "pdf-lib";


export const fillInField = (
  pdfDoc: PDFDocument,
  fieldName: string,
  text: string,
  font: PDFFont
) => {
      // console.log(`field name to find in findAcroFieldByName is ${fieldName}`)

    const field = findAcroFieldByName(pdfDoc, fieldName);
    console.log(`findAcroFieldByName status ${field? 'TRUE':'FALSE'} when looked up by ${fieldName}`);
    if (field) fillAcroTextField(field, text, font);
};

export const lockField = (acroField: PDFDict) => {

    const fieldType = acroField.lookup(PDFName.of("FT"));
    if (fieldType === PDFName.of("Tx")) {
      acroField.set(PDFName.of("Ff"), PDFNumber.of(1 << 0 /* Read Only */));
    }
};

export const getAcroForm = (pdfDoc: PDFDocument) =>
  pdfDoc.catalog.lookupMaybe(PDFName.of("AcroForm"), PDFDict);

export const findAcroFieldByName = (pdfDoc: PDFDocument, name: string) => {
  console.log(`findAcroFieldByName is looking up ${name}`);
  const acroFields = getAcroFields(pdfDoc);
  console.log(`getAcroFields found  ${acroFields.length} things`);

    return acroFields.find((acroField) => {
      const parentName = acroField.get(PDFName.of("Parent"));
      const fieldName = acroField.get(PDFName.of("T"));
      console.log(`found a field matching ${name}: ${acroField? 'acroField: TRUE':'acroField:FALSE'} which has the the fieldName ${fieldName} with a daddy ${parentName}`);
      // console.log(acroField)
      return (
        (fieldName instanceof PDFString || fieldName instanceof PDFHexString) &&
        fieldName.decodeText() === name
      );
    });
};

export const fillAcroTextField = (
  acroField: PDFDict,
  text: string,
  font: PDFFont
) => {
  console.log('oh no no no - I throw this here Expected instance of PDFArray, but got instance of undefined')
    const rect = acroField.lookup(PDFName.of("Rect"), PDFArray);
    console.log('oh yeah yeah yeah')

    const width =
      rect.lookup(2, PDFNumber).value() - rect.lookup(0, PDFNumber).value();
    const height =
      rect.lookup(3, PDFNumber).value() - rect.lookup(1, PDFNumber).value();

    const MK = acroField.lookupMaybe(PDFName.of("MK"), PDFDict);
    const R = MK && MK.lookupMaybe(PDFName.of("R"), PDFNumber);

    const N = singleLineAppearanceStream(font, text, width, height);

    acroField.set(PDFName.of("AP"), acroField.context.obj({ N }));
    acroField.set(PDFName.of("Ff"), PDFNumber.of(1 /* Read Only */));
    acroField.set(PDFName.of("V"), PDFHexString.fromText(text));
};

export const getAcroFields = (pdfDoc: PDFDocument): PDFDict[] => {
    const acroForm = getAcroForm(pdfDoc);
    // loggio.info({},"getAcroFields - getAcroForm")
    // https://github.com/Hopding/pdf-lib/issues/425#issuecomment-620615779
    // acroForm.set(PDFName.of('NeedAppearances'), PDFBool.True)

    if (!acroForm) return [];

    // const rootFields = getRootAcroFields(pdfDoc);
    const rootFields = getRootAcroFields(pdfDoc);
    // rootFields.forEach((rootField) => {
    //   console.log()
    //   console.log('--start--')
    //   console.log('--root_fields--')
    //   console.log('MK')
    //   console.log(`${rootField.lookupMaybe(PDFName.of("MK"), PDFDict)}`);
    //   console.log('----')
    //   console.log('Rect')
    //   console.log(`${rootField.lookupMaybe(PDFName.of("Rect"), PDFArray)}`);
    //   console.log('----')
    //   console.log('AP')
    //   console.log(`${rootField.lookupMaybe(PDFName.of("AP"), PDFDict)}`);
    //   console.log('----')
    //   console.log('V')
    //   console.log(`${rootField.lookup(PDFName.of("V"))}`);
    //   console.log('----')
    //   console.log('T')
    //   console.log(`${rootField.lookup(PDFName.of("T"))}`);
    //   console.log('--root_fields--')
    //   console.log('--end--')
    //   console.log()

    //   // 
    //   // console.log(`found a rootField ${rootField? 'rootField: TRUE':'rootField:FALSE'} which has the the fieldName ${fieldName}`);
      
    // });
  
    // TODO
    // ********
    // Go through all root fields
    // If a root field has kids, recurse through the the kids details 
    // For each of the returned children, merge the parent or childrens properties
    // Fill the form in.
    // ********
    // Important Properties
    // ____________________
    //   console.log(`${rootField.lookupMaybe(PDFName.of("MK"), PDFDict)}`);
    //   console.log(`${rootField.lookupMaybe(PDFName.of("Rect"), PDFArray)}`);
    //   console.log(`${rootField.lookupMaybe(PDFName.of("AP"), PDFDict)}`);
    //   console.log(`${rootField.lookup(PDFName.of("V"))}`);
    //   console.log(`${rootField.lookup(PDFName.of("T"))}`);

    if (!rootFields) return [];

    // const fields: PDFDict[] = [];
    for (let idx = 0, len = rootFields.length; idx < len; idx++) {
      rootFields.push(...recurseAcroFieldKids(rootFields[idx]));
    }

    // rootFields.forEach((cField) => {
    //   rootFields.forEach((cField) => {
    //     console.log()
    //     console.log('--start--')
    //     console.log('--child_fields--')
    //     console.log('T')
    //     console.log(`${cField.lookupMaybe(PDFName.of("T"), PDFString)}`);
    //     console.log('----')
    //     console.log('MK')
    //     console.log(`${cField.lookupMaybe(PDFName.of("MK"), PDFDict)}`);
    //     console.log('----')
    //     console.log('Rect')
    //     console.log(`${cField.lookupMaybe(PDFName.of("Rect"), PDFArray)}`);
    //     console.log('----')
    //     console.log('AP')
    //     console.log(`${cField.lookupMaybe(PDFName.of("AP"), PDFDict)}`);
    //     console.log('----')
    //     console.log('V')
    //     console.log(`${cField.lookup(PDFName.of("V"))}`);
    //     console.log('--child_fields--')
    //     console.log('--end--')
    //     console.log()
  
    //     // 
    //     // console.log(`found a rootField ${rootField? 'rootField: TRUE':'rootField:FALSE'} which has the the fieldName ${fieldName}`);
        
    //   });
      
    // });
  
    console.log('Total fields:', rootFields.length);
    // console.log('Total fields:', fields);
  
    return rootFields;
};

const getRootAcroFields = (pdfDoc: PDFDocument) => {
  if (!pdfDoc.catalog.get(PDFName.of('AcroForm'))) return [];
  const acroForm = pdfDoc.context.lookup(
    pdfDoc.catalog.get(PDFName.of('AcroForm')),
    PDFDict,
  );

  if (!acroForm.get(PDFName.of('Fields'))) return [];
  const acroFieldRefs = acroForm.context.lookup(
    acroForm.get(PDFName.of('Fields')),
    PDFArray,
  );

  const acroFields = new Array<PDFDict>(acroFieldRefs.size());
  for (let idx = 0, len = acroFieldRefs.size(); idx < len; idx++) {
    acroFields[idx] = pdfDoc.context.lookup(acroFieldRefs.get(idx), PDFDict);
  }

  return acroFields;
};

const recurseAcroFieldKids = (field: PDFDict) => {
  const kids = field.lookupMaybe(PDFName.of('Kids'), PDFArray);
  if (!kids) return [field];

  const acroFields = new Array<PDFDict>(kids.size());
  for (let idx = 0, len = kids.size(); idx < len; idx++) {
    acroFields[idx] = field.context.lookup(kids.get(idx), PDFDict);
    // console.log()
    // console.log('--start--')
    // console.log('--kiddy_fields--')
    // console.log('MK')
    // console.log(`${acroFields[idx]}`);
    // console.log('--kiddy_fields--')
    // console.log('--end--')
    // console.log()
  }
  // console.log()
  // console.log('--start--')
  // console.log('--all_kiddy_fields--')
  // console.log(`${acroFields}`);
  // console.log('--all_kiddy_fields--')
  // console.log('--end--')
  // console.log()
  const flatKids: PDFDict[] = [];
  for (let idx = 0, len = acroFields.length; idx < len; idx++) {
    flatKids.push(...recurseAcroFieldKids(acroFields[idx]));
  }

  // console.log()
  // console.log('--start--')
  // console.log('--flatKids--')
  // console.log(`${flatKids}`);
  // console.log('--flatKids--')
  // console.log('--end--')
  // console.log()
  return flatKids;
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

    // const size = font.sizeAtHeight(height - 5);
    const size = font.sizeAtHeight(15); // set it to 15 temp for example
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
};