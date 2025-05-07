import { DriveAdapterConfig } from 'nesoi/lib/elements/entities/drive/drive_adapter';

export type S3Config = {
  s3: {
    key: string,
    secret: string,
    bucket: string,
    region: string,
    endpoint: string
  }
  drive?: DriveAdapterConfig
}