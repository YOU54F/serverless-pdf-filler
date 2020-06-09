import { OKResponse, ErrorResponse } from "..";
export const okResponse = async ({
  encodedPDF,
  logger,
}: OKResponse): Promise<string> => {
  logger.info(
    "Generated PDF successfully, responding 200 OK and returning PDF as base64 string"
  );

  return Promise.resolve(JSON.stringify({ body: `${encodedPDF}` }));
};

export const errorResponse = async ({
  logger,
  StatusCode,
  errorMessage,
}: ErrorResponse): Promise<string> => {
  logger.error({ errorMessage }, "An error occurred");
  return Promise.resolve(
    JSON.stringify({
      StatusCode: StatusCode ? StatusCode : 400,
      FunctionError: errorMessage ? errorMessage : "An error occurred",
    })
  );
};
