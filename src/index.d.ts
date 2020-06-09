import { Context } from "aws-lambda";
import pino from "pino";
import { AWSError } from "aws-sdk";

export type InvocationRequestHandler = (
  event: PdfLambdaRequest,
  context: Context
) => Promise<string | AWSError>;

export interface PdfLambdaRequest {
  template: string;
  formValues: PdfInputValues;
}
interface PdfInputValues {
  single: string;
  multiple: string;
}

export interface OKResponse {
  logger: pino.Logger;
  encodedPDF: string;
}

export interface ErrorResponse {
  logger: pino.Logger;
  StatusCode?: number;
  errorMessage?: string;
}
