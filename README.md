# pdf-form-node

Demo of using [pdf-lib](https://github.com/Hopding/pdf-lib) to fill out form fields in an AcroForm PDF.
Uses QPDF to correct the PDF output.

## Filling in a form field, where it only exists once in a document

To run:

```sh
npm install
npm run single
```

- Reads the `test.pdf` template and outputs as `filled_single.pdf`.
- QPDF is called to correct `filled_single.pdf` and outputs as `fixed_single.pdf`

## Filling in a form field, where it exists more once in a document

To run:

```sh
npm install
npm run multiple
```

- Reads the `test.pdf` template and outputs as `filled_multiple.pdf`.
- QPDF is called to correct `filled_multiple.pdf` and outputs as `fixed_multiple.pdf`
  