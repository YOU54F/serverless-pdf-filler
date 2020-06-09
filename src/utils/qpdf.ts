import { spawn } from "child_process";
import { readFileSync } from "fs";
import pino from "pino";

export const spawnQpdf = (
  input: string,
  logger: pino.Logger
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!input) {
        return reject("No data found");
      }

      let args = ["qpdf"];
      args.push(`/tmp/filled_${input}`);
      args.push(`/tmp/fixed_${input}`);
      logger.info({ args }, "Calling QPDF to correct output");

      const qpdfCLI = spawn("/bin/sh", ["-c", args.join(" ")]);

      //   qpdfCLI.stdout.on('data', data => {
      //     logger.info({},`stdout`);
      // });

      qpdfCLI.stderr.on("data", (data) => {
        logger.error({ error: data.toString() }, `stderr`);
      });

      qpdfCLI.on("close", (code) => {
        logger.info({ code }, `QPDF process exited with code ${code}`);
        if (code === 0) {
          resolve(readFileSync(`/tmp/fixed_${input}`, "base64"));
        } else {
          reject(`Exit code ${code}`);
        }
      });
    } catch (e) {
      logger.error(
        { e },
        "An error occurred whilst during the QPDF correction process"
      );
      reject(e);
    }
  });
};
