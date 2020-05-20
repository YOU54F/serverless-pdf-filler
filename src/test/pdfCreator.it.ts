import { Lambda } from "aws-sdk";
import S3rver from "s3rver";
import {
  params,
  localS3rverConfig,
  uploadPdfToBucket,
  getEvent,
  testPdfName
} from "./utils/utils";
import pino from "pino";
import { PdfLambdaRequest } from "..";
import { s3client } from "../utils/s3Client";
const dest = pino.destination({ sync: false });
const logger = pino(dest).child({
  serviceName: "handlerTest",
});
let instance: S3rver;
const pdfServiceFunctionName = "serverless-pdf-filler-local";
describe("Handler tests", () => {
  beforeAll(async () => {
    instance = new S3rver(localS3rverConfig);
    instance.run();
    try {
      const createdBucket = await s3client().createBucket(params).promise();
      logger.info({ createdBucketResponse: createdBucket.$response });
    } catch (error) {
      logger.info({ error: error.message });
    }
  });

  afterAll(async () => {
    await instance.close();
  });

  it("should return 200 with a valid PDF template", async () => {
    // Act
    await uploadPdfToBucket(testPdfName);

    const sut = await clientLogic(getEvent());

    expect(sut.result.StatusCode).toEqual(200);
    expect(sut.result.FunctionError).toBeUndefined();
    expect(sut.parsed.body.length).toBeGreaterThan(0);
    expect(sut.parsed.body).toContain("JVBERi0xLjcKJb/3ov4KMSAwIG9iago8PCAv");
  });
  it("should return an error if something goes wrong", async () => {
    // Act
    const brokenEvent = getEvent('not_a_file');
    const sut = await clientLogic(brokenEvent);
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

export const clientLogic = async (
  event: PdfLambdaRequest
) => {
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
