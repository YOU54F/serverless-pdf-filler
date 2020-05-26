import { spawn } from "child_process";
const { readableToString } = require("@rauschma/stringio");
import { readFileSync } from "fs";
import pino from "pino";

export const spawnQpdf = (
  input: string,
  logger: pino.Logger
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.info("Calling QPDF to correct output");
      let args = ["qpdf"];
      args.push(`tmp/filled_${input}`);
      args.push(`tmp/fixed_${input}`);
      const childProcess = spawn("/bin/sh", ["-c", args.join(" ")]);
      await readableToString(childProcess.stdout);

      logger.info("Successfully fixed PDF with QPDF and written to temp file");
      const encodedPDF = readFileSync(`tmp/fixed_${input}`, "base64");
      logger.info("Returning base64 encoded PDF");
      return resolve(encodedPDF);
    } catch (e) {
      logger.error(
        { e },
        "An error occurred whilst during the QPDF correction process"
      );
      reject(e);
    }
  });
};
