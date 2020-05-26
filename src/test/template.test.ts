import {
  testEvent,
  testPdfName
} from "./utils/utils";
import { readFileSync } from "fs";
import { TemplateServiceRequest, templateService } from "../utils/template";
import pino from "pino";
const dest = pino.destination({ sync: false });

const logger = pino(dest).child({
  serviceName: "templateTest",
});

export const readPdf = async (filename: string): Promise<Buffer | Error> => {
  try {
    return readFileSync(`./pdf-templates/${filename}`);
  } catch (error) {
    console.log(error);
    return error;
  }
};

describe("Template tests", () => {
  it("should true when it processes a PDF form successfully", async () => {
    // Act
    const pdfDocument = await readPdf(testPdfName);

    const templateServiceParams: TemplateServiceRequest = {
      pdfDocument,
      formValues: testEvent.formValues,
      templateName: testEvent.template,
      logger
    };

    const returnedDocument = await templateService(templateServiceParams);
    expect(returnedDocument).toEqual({ result: true });
  });
  it("should return an error when it fails to process the PDF", async () => {
    // Act

    const templateServiceParams: TemplateServiceRequest = {
      pdfDocument: "pdfDocument",
      formValues: testEvent.formValues,
      templateName: testEvent.template,
      logger
    };

    const returnedDocument = await templateService(templateServiceParams);
    expect(returnedDocument).toEqual({
      error:
        "Error: Failed to parse PDF document (line:0 col:16 offset=8): No PDF header found",
      result: false,
    });
  });
});
