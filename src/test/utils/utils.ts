import { Context } from "aws-lambda";
import { S3, AWSError } from "aws-sdk";
import { readFileSync } from "fs";
import { s3client } from "../../utils/s3Client";
import { PdfInputValues, PdfLambdaRequest } from "index";
export const testPdfName = "test.pdf";

export const params = {
  Bucket: "pdf-templates-local",
};

export const context: Context = {
  awsRequestId: "asdfasdfasdfads",
  callbackWaitsForEmptyEventLoop: false,
  functionName: "woop",
  functionVersion: "123",
  invokedFunctionArn: "arn:123",
  memoryLimitInMB: "123",
  logGroupName: "group",
  logStreamName: "pdf-filler-service",
  getRemainingTimeInMillis: () => 123,
  done: (error: Error | undefined, res: any) => ({}),
  fail: () => ({}),
  succeed: () => ({}),
};

export const defaultFormValues: PdfInputValues = {
  single: "text to input into a single field",
  multiple: "text to input into a multiple fields"
};

export const testEvent: PdfLambdaRequest = {
  template: testPdfName,
  formValues: defaultFormValues
};

export const expectedErrorResponse: string = JSON.stringify({
  StatusCode: 400,
  FunctionError: "Generic Error",
});

export const sampleValidResponse: string = JSON.stringify(
  `{"body": "${expect.any(String)}"}`
);

export const localS3rverConfig = {
  port: 4569,
  hostname: "localhost",
  silent: false,
  directory: "/tmp/s3rver_test_directory",
};

export const uploadPdfToBucket = async (
  filename: string
): Promise<S3.PutObjectOutput | AWSError> => {
  try {
    const putObject = await s3client()
      .putObject({
        ...params,
        Key: filename,
        Body: readFileSync(`./pdf-templates/${filename}`),
      })
      .promise();
    console.log(putObject);
    return putObject;
  } catch (error) {
    console.log(error);
    return error;
  }
};
