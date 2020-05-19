import { readFileSync } from "fs";
import pino from "pino";
const dest = pino.destination({ sync: false });
import { PDFDocument, StandardFonts, PDFName, PDFDict } from "pdf-lib";
import {
  fillInField,
  getAcroFields,
  lockField,
  findAcroFieldByName,
} from "./utils";

async () => {
  const logger = pino(dest).child({
    serviceName: "templateTest",
  });
};
    // ________________________________________________________________________________
    // TODO
    // ________________________________________________________________________________
    // Go through all root fields
    // If a root field has kids, recurse through the the kids details 
    // For each of the returned children, merge the parent or childrens properties
    // Fill the form in.
    // ________________________________________________________________________________
    // Important Properties
    // ________________________________________________________________________________
    //   console.log(`${rootField.lookupMaybe(PDFName.of("MK"), PDFDict)}`);
    //   console.log(`${rootField.lookupMaybe(PDFName.of("Rect"), PDFArray)}`);
    //   console.log(`${rootField.lookupMaybe(PDFName.of("AP"), PDFDict)}`);
    //   console.log(`${rootField.lookup(PDFName.of("V"))}`);
    //   console.log(`${rootField.lookup(PDFName.of("T"))}`);
    // ________________________________________________________________________________
    // fillAcroTextField needs
    // ________________________________________________________________________________
    //    const rect = acroField.lookup(PDFName.of("Rect"), PDFArray);
    //    const MK = acroField.lookupMaybe(PDFName.of("MK"), PDFDict);
    //    acroField.set(PDFName.of("AP"), acroField.context.obj({ N }))
    //    const R = MK && MK.lookupMaybe(PDFName.of("R"), PDFNumber);
    //    acroField.set(PDFName.of("Ff"), PDFNumber.of(1 /* Read Only */));
    //    acroField.set(PDFName.of("V"), PDFHexString.fromText(text));
    // ________________________________________________________________________________


describe("Template tests", () => {
  it("should true when it processes the form successfully", async () => {
    // Act
    const pdfDoc = await PDFDocument.load(readFileSync("./test.pdf"));
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const field = getAcroFields(pdfDoc,helveticaFont);
    field.forEach((rootField) => {
      console.log("--root_fields--");
      const singleParent = {
        DA: { value: '/Helv 6 Tf 0 g' },
        DV: { value: 'this is a single field' },
        T: { value: 'single' },
        V: {
                value: 'this is a single field'
               }
        }
      
      const multipleParent = {
        DA: { value: '/Helv 6 Tf 0 g' },
        DV: { value: 'this is text to be replaced entered in a mulitple form fields, the text get shown on all fields'},
        Kids: "[ 35 0 R 36 0 R ]",
        T: { value: 'multiple' },
        V: {
                value: 'this is text to be replaced entered in a mulitple form fields, the text get shown on all fields'
               }
        }
      if (rootField.lookup(PDFName.of("T"))?.toString() === "(multiple)"){
            expect((rootField.lookup(PDFName.of("DA")))).toBeDefined()
            // expect((rootField.lookup(PDFName.of("DV")))).toBeDefined()
            expect((rootField.lookup(PDFName.of("V")))).toBeDefined()
            expect((rootField.lookup(PDFName.of("T")))).toBeDefined()
            // expect((rootField.lookup(PDFName.of("Kids")))).toBeDefined();
            expect((rootField.lookup(PDFName.of("T")))).toMatchObject(multipleParent.T);
            expect((rootField.lookup(PDFName.of("V")))).toMatchObject(multipleParent.V);
            expect((rootField.lookup(PDFName.of("DA")))).toMatchObject(multipleParent.DA);
      } else if (rootField.lookup(PDFName.of("T"))?.toString() === "(single)") {
        expect((rootField.lookup(PDFName.of("AP")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("F")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("MK")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("P")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Rect")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Subtype")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Type")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("V")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Kids")))).not.toBeDefined();
        expect((rootField.lookup(PDFName.of("T")))).toMatchObject(singleParent.T);
        expect((rootField.lookup(PDFName.of("V")))).toMatchObject(singleParent.V);
        expect((rootField.lookup(PDFName.of("DA")))).toMatchObject(singleParent.DA);
      } else {
        expect((rootField.lookup(PDFName.of("AP")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("F")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("MK")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("P")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Rect")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Subtype")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Type")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Parent")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Kids")))).not.toBeDefined();
        // These should come from the parent
        // expect((rootField.lookup(PDFName.of("DV")))).toBeDefined()
        // expect((rootField.lookup(PDFName.of("FT")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("T")))).toMatchObject({"value": "multiple"});
        expect((rootField.lookup(PDFName.of("V")))).toMatchObject({"value": "this is text to be replaced entered in a mulitple form fields, the text get shown on all fields"});
        expect((rootField.lookup(PDFName.of("DA")))).toMatchObject({"value": "/Helv 6 Tf 0 g"});
      }
    });
  });
});

const singleField = 
`<<
    /AP <<
    /N 105 0 R
    >>
    /BS <<
    /S /S
    /W 0
    >>
    /DA (/Helv 6 Tf 0 g)
    /DV (this is a single field)
    /F 4
    /FT /Tx
    /MK <<
    >>
    /P 19 0 R
    /Rect [ 264.379 488.376 504.748 528.144 ]
    /Subtype /Widget
    /T (single)
    /Type /Annot
    /V (this is a single field)
    >>`



  const multipleField = 
  `<<
  /DA (/Helv 6 Tf 0 g)
  /DV (this is text to be replaced entered in a mulitple form fields, the text get shown on all fields)
  /FT /Tx
  /Kids [ 35 0 R 36 0 R ]
  /T (multiple)
  /V (this is text to be replaced entered in a mulitple form fields, the text get shown on all fields)
  >>`



  const multipleFieldKids = 
  `<<
  /AP <<
  /N 104 0 R
  >>
  /BS <<
  /S /S
  /W 0
  >>
  /F 4
  /MK <<
  >>
  /P 19 0 R
  /Parent 102 0 R
  /Rect [ 264.775 379.39 505.144 419.158 ]
  /Subtype /Widget
  /Type /Annot
  >>`

 

