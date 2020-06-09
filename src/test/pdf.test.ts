import { handler } from "../functions/pdf";
import S3rver from "s3rver";
import {
  params,
  localS3rverConfig,
  uploadPdfToBucket,
  context,
  testEvent,
  testPdfName,
} from "./utils/utils";
import { s3client } from "../utils/s3Client";
import { getMockLogger } from "./utils/getMockLogger";

let instance: S3rver;
const logger = getMockLogger();

describe("Handler tests", () => {
  beforeAll(async () => {
    instance = new S3rver(localS3rverConfig);
    instance.run();
    try {
      const createdBucket = await s3client().createBucket(params).promise();
      logger.info(createdBucket);
    } catch (error) {
      logger.error(error);
    }
  });

  afterAll(async () => {
    await instance.close();
  });

  it("should return 200 when it process a PDF successfully", async () => {
    // Arrange
    await uploadPdfToBucket(testPdfName);
    // Act
    const sut = await handler(testEvent, context);
    // Assert
    const result = JSON.parse(`${sut}`);
    expect(result.body).toContain("JVBERi0xLjcKJb/3ov4KMSAwIG9iago8PCAv");
  });
  it("should return 404 when a template doesnt exist", async () => {
    // Act
    const sut = await handler(
      { ...testEvent, template: "not_a_file" },
      context
    );
    // Assert
    const result = JSON.parse(`${sut}`);
    expect(result.StatusCode).toEqual(404);
    expect(result.FunctionError).toContain("The specified key does not exist.");
  });
});
