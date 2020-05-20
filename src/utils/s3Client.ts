import { S3 } from "aws-sdk";
import pino from "pino";
import {getEnv} from "../utils/getEnv";
import { stageIsLocal } from "../utils/isLocal";

export const s3client = (): S3 => {
  const stage = getEnv("CURRENT_ENV","local");
  const isLocal = stageIsLocal(stage);
  if (isLocal) {
    const endpoint = getEnv("LOCAL_S3_URL","http://localhost:4569");
    const accessKeyId = getEnv("LOCAL_AWS_ACCESS_KEY_ID","S3RVER");
    const secretAccessKey = getEnv("LOCAL_AWS_SECRET_ACCESS_KEY","S3RVER");
    return new S3({
      s3ForcePathStyle: true,
      accessKeyId,
      secretAccessKey,
      endpoint,
    });
  } else {
    return new S3()
  }
};

export const downloadFromS3ToStream = (
  bucketName: string,
  keyName: string,
  logger: pino.Logger
): Promise<AWS.S3.Body | AWS.AWSError> => {
  return new Promise((resolve, reject) => {
    return s3client().getObject(
      { Bucket: bucketName, Key: keyName },
      (error: AWS.AWSError, data: AWS.S3.GetObjectOutput) => {
        if (error) {
          logger.error(
            { error, template: keyName, bucketName },
            "Error occured retrieving template"
          );
          reject(error);
        } else {
          logger.info(
            { lastModified: data.LastModified, template: keyName, bucketName },
            "Retrieved templated successfully"
          );
          resolve(data.Body);
        }
      }
    );
  });
};
