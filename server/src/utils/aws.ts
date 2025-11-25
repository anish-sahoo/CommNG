import { BadRequestError } from "../types/errors.js";

export const ensureUsingAws = (message: string): void => {
  if (
    !(
      process.env.S3_BUCKET_NAME && process.env.USE_PRESIGNED_UPLOADS === "true"
    )
  ) {
    throw new BadRequestError(message);
  }
};
export const ensureNOTUsingAws = (message: string): void => {
  if (
    process.env.S3_BUCKET_NAME ||
    process.env.USE_PRESIGNED_UPLOADS === "true"
  ) {
    throw new BadRequestError(message);
  }
};
