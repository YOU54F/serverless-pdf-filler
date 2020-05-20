# serverless-pdf-filler

A Lambda function that utilises [pdf-lib](https://github.com/Hopding/pdf-lib) to fill out PDF form fields in an adobe acrobat form, and uses QPDF to correct the PDF output.

- Reads template key & form values from incoming request
- Retrieves template from S3 bucket via template key
- Fills form fields using `pdf-lib`
- Calls `qpdf` to correct PDF output
- Returns filled PDF as a base64 encoded string

## Installation & Execution instructions

To run:

```sh
yarn install // Install Deps
make local-pdf-service // Start the local service
make local-bucket-populate // Add PDF templates to local S3 instance
```

To invoke:

```sh
make local-lambda-curl // Invokes the lambda and outputs to `./tmp` as `out****.json`
make b64-to-pdf // Converts lambda output to a PDF `./out/final_****.pdf`
```

To test:

The following command will run the unit tests.

```sh
yarn run test:unit tests
```

The following command will run the unit tests, and then start the app, wait for it to load and run the integration tests.

```sh
yarn run test:all
```

It will also output each PDF template filled in to `./tmp/filled_****.pdf`
And the QPDF output will be at `./tmp/fixed_****.pdf`


## Packaging Runtime Dependencies

### Generate the layer for running pdf-lib

Run `make layer-pdflib`

### Generate the layer for running qpdf

Run `make layer-qpdf`
