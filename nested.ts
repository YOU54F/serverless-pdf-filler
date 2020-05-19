import fs from 'fs';
import { PDFArray, PDFDict, PDFDocument, PDFName } from "pdf-lib";

const recurseAcroFieldKids = (field: PDFDict) => {
  const kids = field.lookupMaybe(PDFName.of('Kids'), PDFArray);
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

(async () => {
  const pdfDoc = await PDFDocument.load(fs.readFileSync('./test.pdf'));

  const rootFields = getRootAcroFields(pdfDoc);

  // rootFields.forEach((rootField) => {
  //   console.log('rootField');
  //   console.log(String(rootField));
  //   console.log();
  // });

  console.log('Total fields:', rootFields.length);


  const fields: PDFDict[] = [];
  for (let idx = 0, len = rootFields  .length; idx < len; idx++) {
    fields.push(...recurseAcroFieldKids(rootFields[idx]));
  }

  // fields.forEach((field) => {
  //   console.log('childField');
  //   console.log(String(field));
  //   console.log();
  // });

  console.log('Total childFields:', fields.length);
})();