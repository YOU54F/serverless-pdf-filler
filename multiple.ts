import { readFileSync, writeFileSync } from "fs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { fillInField, getAcroFields, lockField } from "./utils";

(async () => {
  const pdfDoc = await PDFDocument.load(readFileSync("./test.pdf"));
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  console.log('Filling in a PDF form field by name, where multiple fields exist with the same name')

  var formValuesMultiple = {
    multiple: "identical text to apply to multiple fields",
    single: "text to apply to a single field",
  };

  Object.entries(formValuesMultiple).forEach((entry) => {
    fillInField(pdfDoc, entry[0], entry[1], helveticaFont);
  });
  const acroFieldsMultiple = getAcroFields(pdfDoc);
  acroFieldsMultiple.forEach((field) => lockField(field));

  const pdfBytesMultiple = await pdfDoc.save();

  writeFileSync("filled_multiple.pdf", pdfBytesMultiple);

})();
