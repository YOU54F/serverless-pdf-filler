import { Lambda } from "aws-sdk";
import { testEvent } from "./utils/utils";
import { getMockLogger } from "./utils/getMockLogger";
import { PdfLambdaRequest } from "..";

const logger = getMockLogger();

const pdfServiceFunctionName = "serverless-pdf-filler-local";
describe("Handler tests", () => {
  it("should return 200 with a valid PDF template", async () => {
    // Act
    const sut = await clientLogic(testEvent);
    // Assert
    expect(sut.result.StatusCode).toEqual(200);
    expect(sut.result.FunctionError).toBeUndefined();
    expect(sut.parsed.body.length).toBeGreaterThan(0);
    expect(sut.parsed.body).toContain("JVBERi0xLjcKJb/3ov4KMSAwIG9iago8PCAv");
  });
  it("should return an error if something goes wrong", async () => {
    // Act
    const sut = await clientLogic({ ...testEvent, template: "not_a_file" });
    // Assert
    expect(sut.result.StatusCode).toEqual(200);
    expect(sut.result.FunctionError).toBeUndefined();
    expect(sut.parsed.body).toBeUndefined();
    expect(sut.parsed.StatusCode).toEqual(404);
    expect(sut.parsed.FunctionError).toEqual(
      "The specified key does not exist."
    );
  });
});

export interface PdfLambdaProvider {
  createLambda: () => Lambda;
}

export const getPdfLambdaProvider = () => ({
  createLambda: () => {
    const endpoint = process.env.PDF_ENDPOINT || "http://localhost:3009";

    if (endpoint) {
      return new Lambda({ endpoint, region: "eu-west-2" });
    }

    return new Lambda();
  },
});

export const clientLogic = async (event: PdfLambdaRequest) => {
  const lambda = getPdfLambdaProvider().createLambda();
  const result = await lambda
    .invoke({
      FunctionName: pdfServiceFunctionName,
      Payload: JSON.stringify(event),
    })
    .promise();
  let parsed;
  try {
    const json = result.Payload as string;
    parsed = JSON.parse(json);
    if (
      result.StatusCode !== 200 ||
      result.FunctionError ||
      parsed.body.length === 0
    ) {
      logger.error(
        {
          invocationStatusCode: result.StatusCode,
          payload: result.Payload,
          pdfLength: parsed.body.length,
        },
        "failed to render PDF"
      );
      logger.error("Failed to render PDF");
    }
  } catch (e) {
    logger.warn({ e }, "Failed parsed = JSON.parse(json)");
  }

  return {
    result,
    parsed,
  };
};
