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
  StandardFonts,
} from "pdf-lib";

export const fillInField = (
  pdfDoc: PDFDocument,
  fieldName: string,
  text: string,
  font: PDFFont
) => {
  // console.log(`field name to find in findAcroFieldByName is ${fieldName}`)

  const field = findAcroFieldByName(pdfDoc, fieldName,font);
  // const field = findAcroFieldByNameWithFont(pdfDoc, fieldName,text,font);
  console.log(
    `findAcroFieldByName status ${
      field ? "TRUE" : "FALSE"
    } when looked up by ${fieldName}`
  );
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


export const findAcroFieldByName = (pdfDoc: PDFDocument, name: string, font: PDFFont) => {
  console.log(`findAcroFieldByName is looking up ${name}`);
  const acroFields = getAcroFields(pdfDoc,font);
  console.log(`getAcroFields found  ${acroFields.length} things`);

  return acroFields.find((acroField) => {
    const parentName = acroField.get(PDFName.of("Parent"));
    const fieldName = acroField.get(PDFName.of("T"));
    console.log(
      `found a field matching ${name}: ${
        acroField ? "acroField: TRUE" : "acroField:FALSE"
      } which has the the fieldName ${fieldName} with a daddy ${parentName}`
    );
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
  console.log(
    "oh no no no - I throw this here Expected instance of PDFArray, but got instance of undefined"
  );
  const rect = acroField.lookup(PDFName.of("Rect"), PDFArray);
  console.log("oh yeah yeah yeah");

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

export const getAcroFields = (pdfDoc: PDFDocument, font: PDFFont): PDFDict[] => {
  const acroForm = getAcroForm(pdfDoc);
  if (!acroForm) return [];
  // https://github.com/Hopding/pdf-lib/issues/425#issuecomment-620615779
  // acroForm.set(PDFName.of('NeedAppearances'), PDFBool.True)

  // 2. If a root field has kids, recurse through the the kids details
  // 3. For each of the returned children, merge the parent or childrens properties
  // 4. Fill the form in.
  const rootFields = getRootAcroFields(pdfDoc);
  if (!rootFields) return [];
  const childFields: PDFDict[] = [];
  const rootFieldsWithoutChildren: PDFDict[] = [];
  const rootFieldsWithChildren: PDFDict[] = [];
  let rootFieldsMergedChildren: PDFDict[] = [];
  let mergedFields: PDFDict[] = [];
  // 1. Go through all root fields
  rootFields.forEach((rootField) => {
    console.log(
      `Found a field with text: ${rootField.lookupMaybe(
        PDFName.of("T"),
        PDFString
      )}, checking if it has child elements`
    );
    // 2. Split the root fields into those with childrean
    if (rootField.lookup(PDFName.of("Kids"))) {
      rootFieldsWithChildren.push(rootField);
    } else {
      rootFieldsWithoutChildren.push(rootField);
    }
  });

  console.log(`
    rootFields: ${rootFields.length} \n
    rootFieldsWithChildren: ${rootFieldsWithChildren.length} \n
    rootFieldsWithoutChildren: ${rootFieldsWithoutChildren.length} \n
    `);

  if (rootFieldsWithChildren !== []) {
    // get values for each
    // 2. If a root field has kids, get the children
    for (let idx = 0, len = rootFieldsWithChildren.length; idx < len; idx++) {
      childFields.push(...recurseAcroFieldKids(rootFieldsWithChildren[idx]));
    }
  
    childFields.forEach((childField) => {

      fillAcroTextField(childField,'test',font)
      
      // childField.set(PDFName.of("T"),PDFString.of('multiple'))
      // childField.set(PDFName.of("V"),PDFString.of('multiple'))
        // attach the props from
        // childField.set(PDFName.of("Font"),PDFString.of('/Helv 6 Tf 0 g'))
    // acroFields[idx].set(PDFName.of("T"),PDFString.of('multiple'))
      // childField.set(
      //   PDFName.of("V"),
      //   PDFString.of(
      //     "this is tffffs"
      //   )
      // );
    });
    
    return childFields
    // return [...childFields,...rootFieldsWithoutChildren];
    // return [...rootFieldsWithoutChildren,...childFields];
  } else if (
    rootFieldsWithChildren === [] &&
    rootFieldsWithoutChildren !== []
  ) {
    console.log(
      `return rootFieldsWithoutChildren: ${rootFieldsWithoutChildren.length}`
    );
    return rootFieldsWithoutChildren;
  } else {
    console.log(`return rootFields: ${rootFields.length}`);
    return rootFields;
  }

  // if ((rootField.lookup(PDFName.of("Kids")))){
  //   console.log(`Found a child for the field with text: ${rootField.lookupMaybe(PDFName.of("T"), PDFString)}`);
  //   for (let idx = 0, len = rootFields.length; idx < len; idx++) {
  //     childFields.push(...recurseAcroFieldKids(rootFields[idx]));
  //   }
  // }
  //   childFields.forEach((childField) => {
  //     let mergedField = childField & rootField
  //     mergedFields.push(mergedField)
  //   })
  // })
};

const getRootAcroFields = (pdfDoc: PDFDocument) => {
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
};

const recurseAcroFieldKids = (field: PDFDict) => {
  const kids = field.lookupMaybe(PDFName.of("Kids"), PDFArray);
  if (!kids) return [field];
  const acroFields = new Array<PDFDict>(kids.size());
  for (let idx = 0, len = kids.size(); idx < len; idx++) {
    acroFields[idx] = field.context.lookup(kids.get(idx), PDFDict)
    // acroFields[idx].set(PDFName.of("T"),PDFString.of('multiple'))
  }
  const flatKids: PDFDict[] = [];
  for (let idx = 0, len = acroFields.length; idx < len; idx++) {
    // attach the props from
    // acroFields[idx].set(PDFName.of("DA"),PDFString.of('/Helv 6 Tf 0 g'))
    // 
    // acroFields[idx].set(PDFName.of("T"),PDFString.of('multiple'))
    // acroFields[idx].set(PDFName.of("V"),PDFString.of('multiple'))
    flatKids.push(...recurseAcroFieldKids(acroFields[idx]));
  }
  return flatKids;
};

const recurseAcroFields = (field: PDFDict) => {
  const fields = field.lookupMaybe(PDFName.of("Fields"), PDFArray);
  if (!fields) return [field];
  const acroFields = new Array<PDFDict>(fields.size());
  for (let idx = 0, len = fields.size(); idx < len; idx++) {
    acroFields[idx] = field.context.lookup(fields.get(idx), PDFDict);
  }
  const flatFields: PDFDict[] = [];
  for (let idx = 0, len = acroFields.length; idx < len; idx++) {
    flatFields.push(...recurseAcroFields(acroFields[idx]));
  }
  return flatFields;
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
