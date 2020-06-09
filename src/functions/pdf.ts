import { downloadFromS3ToStream } from "../utils/s3Client";
import { TemplateServiceRequest, templateService } from "../utils/template";
import pino from "pino";
import { spawnQpdf } from "../utils/qpdf";
import { okResponse, errorResponse } from "../utils/responses";
import { InvocationRequestHandler } from "..";
import { getEnv } from "../utils/getEnv";

export const handler: InvocationRequestHandler = async (
  event,
  context
) => {
  const dest = pino.destination({ sync: false });
  const { awsRequestId, functionName } = context;
  const stage = getEnv("CURRENT_ENV", "local");
  const bucketName = getEnv(
    "PDF_TEMPLATE_BUCKET",
    `serverless-pdf-filler-templates-${stage}`
  );
  const templateName = event.template;
  const logger = pino(dest).child({
    awsRequestId,
    functionName,
    templateName,
    bucketName,
  });
  try {
    const formValues = event.formValues;

    logger.info("Received request for template, retrieving PDF from S3");
    logger.debug({ formValues });
    if (templateName == null || !templateName) {
      throw new Error("No template name specified");
    }
    const fileStream = await downloadFromS3ToStream(
      bucketName,
      templateName,
      logger
    );
    const templateServiceParams: TemplateServiceRequest = {
      pdfDocument: fileStream,
      formValues,
      templateName,
      logger,
    };
    const templateServiceResult = await templateService(templateServiceParams);

    if (templateServiceResult.result === true) {
      const qdfOutput = await spawnQpdf(templateName, logger);
      const result = await okResponse({ encodedPDF: qdfOutput, logger });
      return result;
    } else {
      return await errorResponse({
        logger,
        errorMessage: templateServiceResult.error,
        StatusCode: 400,
      });
    }
  } catch (error) {
    logger.error(error);

    if (
      error.message &&
      error.message === "The specified key does not exist."
    ) {
      return await errorResponse({
        logger,
        errorMessage: error.message,
        StatusCode: 404,
      });
    } else if (error.message) {
      return await errorResponse({ logger, errorMessage: error.message });
    } else {
      return await errorResponse({ logger, errorMessage: error });
    }
  } finally {
    dest.flushSync();
  }
};
