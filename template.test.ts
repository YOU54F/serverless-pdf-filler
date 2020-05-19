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
describe("Template tests", () => {
  it("should true when it processes the form successfully", async () => {
    // Act
    const pdfDoc = await PDFDocument.load(readFileSync("./test.pdf"));

    const field = getAcroFields(pdfDoc);
    field.forEach((rootField) => {
      console.log("--root_fields--");
      const multiObj = {
        MK: rootField.lookup(PDFName.of("MK")),
        Kids: "/Kids",
        DA: "/DA (/Helv 6 Tf 0 g)",
        V:
          "/V (this is text to be replaced entered in a mulitple form fields, the text get shown on all fields)",
        T: "/T (multiple)",
      };
      const singleObj = {
        MK: rootField.lookup(PDFName.of("MK")),
        DA: "/DA (/Helv 6 Tf 0 g)",
        V:
          "/V (this is a single field)",
        T: "/T (single)",
      };
      // rootField.lookup(PDFName.of("AP"))

      if (rootField.lookup(PDFName.of("T"))?.toString() === "(multiple)"){
            expect((rootField.lookup(PDFName.of("DA")))).toBeDefined()
            expect((rootField.lookup(PDFName.of("DV")))).toBeDefined()
            expect((rootField.lookup(PDFName.of("FT")))).toBeDefined()
            expect((rootField.lookup(PDFName.of("V")))).toBeDefined()
            expect((rootField.lookup(PDFName.of("T")))).toBeDefined()
            expect((rootField.lookup(PDFName.of("Kids")))).toBeDefined();
            expect((rootField.lookup(PDFName.of("T")))).toMatchObject({"value": "multiple"});
            expect((rootField.lookup(PDFName.of("V")))).toMatchObject({"value": "this is text to be replaced entered in a mulitple form fields, the text get shown on all fields"});
            expect((rootField.lookup(PDFName.of("DA")))).toMatchObject({"value": "/Helv 6 Tf 0 g"});
      } else if (rootField.lookup(PDFName.of("T"))?.toString() === "(single)") {
        expect((rootField.lookup(PDFName.of("AP")))).toBeDefined()
        // expect((rootField.lookup(PDFName.of("N")))).toBeDefined()
        // expect((rootField.lookup(PDFName.of("S")))).toBeDefined()
        // expect((rootField.lookup(PDFName.of("W")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("DA")))).toMatchObject({"value": "/Helv 6 Tf 0 g"});
        expect((rootField.lookup(PDFName.of("DA")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("DV")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("F")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("FT")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("MK")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("P")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Rect")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Subtype")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("T")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Type")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("V")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Kids")))).not.toBeDefined();
        expect((rootField.lookup(PDFName.of("T")))).toMatchObject({"value": "single"});
        expect((rootField.lookup(PDFName.of("V")))).toMatchObject({"value": "this is a single field"});
        expect((rootField.lookup(PDFName.of("DA")))).toMatchObject({"value": "/Helv 6 Tf 0 g"});
      } else {
        expect((rootField.lookup(PDFName.of("AP")))).toBeDefined()
        // expect((rootField.lookup(PDFName.of("N")))).toBeDefined()
        // expect((rootField.lookup(PDFName.of("S")))).toBeDefined()
        // expect((rootField.lookup(PDFName.of("W")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("F")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("MK")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("P")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Rect")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Subtype")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Type")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Parent")))).toBeDefined()
        expect((rootField.lookup(PDFName.of("Kids")))).not.toBeDefined();
        // These should come from the parent
        // expect((rootField.lookup(PDFName.of("DA")))).toBeDefined()
        // expect((rootField.lookup(PDFName.of("DV")))).toBeDefined()
        // expect((rootField.lookup(PDFName.of("FT")))).toBeDefined()
        // expect((rootField.lookup(PDFName.of("V")))).toBeDefined()
        // expect((rootField.lookup(PDFName.of("T")))).toBeDefined()
        // expect((rootField.lookup(PDFName.of("T")))).toMatchObject({"value": "multiple"});
        // expect((rootField.lookup(PDFName.of("V")))).toMatchObject({"value": "this is text to be replaced entered in a mulitple form fields, the text get shown on all fields"});
        // expect((rootField.lookup(PDFName.of("DA")))).toMatchObject({"value": "/Helv 6 Tf 0 g"});
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




// fillAcroTextField needs
// // these three exist on everything
//    const rect = acroField.lookup(PDFName.of("Rect"), PDFArray);
//    const MK = acroField.lookupMaybe(PDFName.of("MK"), PDFDict);
//   acroField.set(PDFName.of("AP"), acroField.context.obj({ N }))
// // these dont exit exist on nothing

//    const R = MK && MK.lookupMaybe(PDFName.of("R"), PDFNumber);
//    acroField.set(PDFName.of("Ff"), PDFNumber.of(1 /* Read Only */));
//    // just on the parent

//    acroField.set(PDFName.of("V"), PDFHexString.fromText(text));



// found a field matching multiple: acroField: TRUE which has the the fieldName undefined

// PDFDict {
//  dict: Map {
//    PDFName { encodedName: '/AP' } => PDFDict { dict: [Map], context: [PDFContext] },
//    PDFName { encodedName: '/BS' } => PDFDict { dict: [Map], context: [PDFContext] },
//    PDFName { encodedName: '/F' } => PDFNumber { numberValue: 4, stringValue: '4' },
//    PDFName { encodedName: '/MK' } => PDFDict { dict: Map {}, context: [PDFContext] },
//    PDFName { encodedName: '/P' } => PDFRef { objectNumber: 19, generationNumber: 0, tag: '19 0 R' },
//    PDFName { encodedName: '/Parent' } => PDFRef { objectNumber: 102, generationNumber: 0, tag: '102 0 R' },
//    PDFName { encodedName: '/Rect' } => PDFArray { array: [Array], context: [PDFContext] },
//    PDFName { encodedName: '/Subtype' } => PDFName { encodedName: '/Widget' },
//    PDFName { encodedName: '/Type' } => PDFName { encodedName: '/Annot' }
//  },
// PDFDict {
//  dict: Map {
//    PDFName { encodedName: '/AP' } => PDFDict { dict: [Map], context: [PDFContext] },
//    PDFName { encodedName: '/BS' } => PDFDict { dict: [Map], context: [PDFContext] },
//    PDFName { encodedName: '/DA' } => PDFString { value: '/Helv 6 Tf 0 g' },
//    PDFName { encodedName: '/F' } => PDFNumber { numberValue: 4, stringValue: '4' },
//    PDFName { encodedName: '/MK' } => PDFDict { dict: Map {}, context: [PDFContext] },
//    PDFName { encodedName: '/P' } => PDFRef { objectNumber: 19, generationNumber: 0, tag: '19 0 R' },
//    PDFName { encodedName: '/Parent' } => PDFRef { objectNumber: 102, generationNumber: 0, tag: '102 0 R' },
//    PDFName { encodedName: '/Rect' } => PDFArray { array: [Array], context: [PDFContext] },
//    PDFName { encodedName: '/Subtype' } => PDFName { encodedName: '/Widget' },
//    PDFName { encodedName: '/Type' } => PDFName { encodedName: '/Annot' }
//  },
// found a field matching single: acroField: TRUE which has the the fieldName (single)
//  {
// const test =  Map {
//    PDFName { encodedName: '/AP' } => PDFDict { dict: [Map], context: [PDFContext] },
//    PDFName { encodedName: '/BS' } => PDFDict { dict: [Map], context: [PDFContext] },
//    PDFName { encodedName: '/DA' } => PDFString { value: '/Helv 6 Tf 0 g' },
//    PDFName { encodedName: '/DV' } => PDFString { value: 'this is a single field' },
//    PDFName { encodedName: '/F' } => PDFNumber { numberValue: 4, stringValue: '4' },
//    PDFName { encodedName: '/FT' } => PDFName { encodedName: '/Tx' },
//    PDFName { encodedName: '/MK' } => PDFDict { dict: Map {}, context: [PDFContext] },
//    PDFName { encodedName: '/P' } => PDFRef { objectNumber: 19, generationNumber: 0, tag: '19 0 R' },
//    PDFName { encodedName: '/Rect' } => PDFArray { array: [Array], context: [PDFContext] },
//    PDFName { encodedName: '/Subtype' } => PDFName { encodedName: '/Widget' },
//    PDFName { encodedName: '/T' } => PDFString { value: 'single' },
//    PDFName { encodedName: '/Type' } => PDFName { encodedName: '/Annot' },
//    PDFName { encodedName: '/V' } => PDFString { value: 'this is a single field' }
//  },


// /V (this is a single field)
// >>
// [
//   [
//     PDFName { encodedName: '/AP' },
//     PDFDict { dict: [Map], context: [PDFContext] }
//   ],
//   [
//     PDFName { encodedName: '/BS' },
//     PDFDict { dict: [Map], context: [PDFContext] }
//   ],
//   [
//     PDFName { encodedName: '/DA' },
//     PDFString { value: '/Helv 6 Tf 0 g' }
//   ],
//   [
//     PDFName { encodedName: '/DV' },
//     PDFString { value: 'this is a single field' }
//   ],
//   [
//     PDFName { encodedName: '/F' },
//     PDFNumber { numberValue: 4, stringValue: '4' }
//   ],
//   [ PDFName { encodedName: '/FT' }, PDFName { encodedName: '/Tx' } ],
//   [
//     PDFName { encodedName: '/MK' },
//     PDFDict { dict: Map {}, context: [PDFContext] }
//   ],
//   [
//     PDFName { encodedName: '/P' },
//     PDFRef { objectNumber: 19, generationNumber: 0, tag: '19 0 R' }
//   ],
//   [
//     PDFName { encodedName: '/Rect' },
//     PDFArray { array: [Array], context: [PDFContext] }
//   ],
//   [
//     PDFName { encodedName: '/Subtype' },
//     PDFName { encodedName: '/Widget' }
//   ],
//   [ PDFName { encodedName: '/T' }, PDFString { value: 'single' } ],
//   [
//     PDFName { encodedName: '/Type' },
//     PDFName { encodedName: '/Annot' }
//   ],
//   [
//     PDFName { encodedName: '/V' },
//     PDFString { value: 'this is a single field' }
//   ]
// ]
// rootField entries: <<
// /DA (/Helv 6 Tf 0 g)
// /DV (this is text to be replaced entered in a mulitple form fields, the text get shown on all fields)
// /FT /Tx
// /Kids [ 35 0 R 36 0 R ]
// /T (multiple)
// /V (this is text to be replaced entered in a mulitple form fields, the text get shown on all fields)
// >>
// [
//   [
//     PDFName { encodedName: '/DA' },
//     PDFString { value: '/Helv 6 Tf 0 g' }
//   ],
//   [
//     PDFName { encodedName: '/DV' },
//     PDFString {
//       value: 'this is text to be replaced entered in a mulitple form fields, the text get shown on all fields'
//     }
//   ],
//   [ PDFName { encodedName: '/FT' }, PDFName { encodedName: '/Tx' } ],
//   [
//     PDFName { encodedName: '/Kids' },
//     PDFArray { array: [Array], context: [PDFContext] }
//   ],
//   [ PDFName { encodedName: '/T' }, PDFString { value: 'multiple' } ],
//   [
//     PDFName { encodedName: '/V' },
//     PDFString {
//       value: 'this is text to be replaced entered in a mulitple form fields, the text get shown on all fields'
//     }
//   ]
// ]