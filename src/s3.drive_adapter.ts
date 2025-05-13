import { DriveAdapter, DriveAdapterConfig } from 'nesoi/lib/elements/entities/drive/drive_adapter';
import { NesoiFile } from 'nesoi/lib/engine/data/file';
import fs from 'fs';
import { S3Service } from './s3.service';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Mime } from 'nesoi/lib/engine/util/mime';

import path from 'path';

export type S3DriveAdapterConfig = DriveAdapterConfig & {
  s3: {
    key: string,
    secret: string,
    bucket: string,
    region: string,
    endpoint: string
  }
}

export class S3DriveAdapter extends DriveAdapter {

    constructor(
    public service: S3Service
    ) {
        super(service.config.drive);
    }

    async public(remoteFile: NesoiFile, filename?: string): Promise<string> {
        const key = remoteFile.filepath;
        filename = filename || remoteFile.originalFilename || undefined;
        const url = getSignedUrl(this.service.s3, new GetObjectCommand({
            Bucket: this.service.config.s3.bucket,
            Key: key,
            ResponseContentDisposition: filename ? `inline; filename="${filename}"` : 'inline'
        }), { expiresIn: 300 });
        return Promise.resolve(url);
    }
  
    read(remoteFile: NesoiFile): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const key = remoteFile.filepath;
            this.service.s3.send(new GetObjectCommand({
                Bucket: this.service.config.s3.bucket,
                Key: key
            }), (err: Error | undefined, data) => {
                if (err) {
                    reject(err);
                }
                if (!data?.Body) {
                    reject(new Error(`No data.Body received from S3 for file ${key}`));
                }
                else {
                    (data.Body as any).toArray().then((arr: any) => {
                        resolve(Buffer.concat(arr));
                    })
                        .catch(reject);
                }
            });
        });
    }
  
    delete(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    move(): Promise<void> {
        throw new Error('Method not implemented.');
    }
  
    new(filename: string, data: string | NodeJS.ArrayBufferView, dirpath?: string): Promise<NesoiFile> {
        return new Promise((resolve, reject) => {
            const filepath = (dirpath ? (dirpath+'/') : '') + filename;
            const body = (data as any).toString();
            this.service.s3.send(new PutObjectCommand({
                Bucket: this.service.config.s3.bucket,
                Key: filepath,
                Body: body
            }), (err?: Error): void => {
                if (err) {
                    reject(err);
                }
                else {
                    const extname = path.extname(filename);
                    const mimetype = Mime.ofExtname(extname);
                    resolve(new NesoiFile(
                        filepath,
                        filename,
                        extname,
                        mimetype,
                        body.length,
                        null,
                        null
                    ));
                }
            });
        });
    }

    upload(localFile: NesoiFile, dirpath?: string, newFilename?: string): Promise<NesoiFile> {
        return new Promise((resolve, reject) => {
      
            const filename = newFilename || localFile.filename;
            const filepath = (dirpath ? (dirpath+'/') : '') + filename;
      
            this.service.s3.send(new PutObjectCommand({
                Bucket: this.service.config.s3.bucket,
                Key: filepath,
                Body: fs.createReadStream(localFile.filepath)
            }), (err?: Error): void => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(NesoiFile.from(localFile, {
                        filepath,
                        filename,
                    }));
                }
            });
        });
    }

}
