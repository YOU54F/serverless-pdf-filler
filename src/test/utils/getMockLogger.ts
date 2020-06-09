import pino from "pino";

const noOutputLevel = 'silent';

interface MockLoggerOptions {
  output?: true;
}

export const getMockLogger = (options?: MockLoggerOptions) =>
  pino({
    name: "serverless-pdf-filler-mock-logger",
    level: options && options.output ? 'debug' : noOutputLevel
  });


