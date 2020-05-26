import { OKResponse, ErrorResponse } from "..";
export const okResponse = async ({ encodedPDF, logger }: OKResponse) => {
  logger.info(
    "Generated PDF successfully, responding 200 OK and returning PDF as base64 string"
  );
  const result = `{"body": "${encodedPDF}"}`;

  return Promise.resolve(result);
};

export const errorResponse = async ({
  logger,
  StatusCode,
  errorMessage,
}: ErrorResponse): Promise<String> => {
  logger.error({ errorMessage }, "An error occurred");
  return Promise.resolve(
    JSON.stringify({
      StatusCode: StatusCode ? StatusCode : 400,
      FunctionError: errorMessage ? errorMessage : "An error occurred",
    })
  );
};
