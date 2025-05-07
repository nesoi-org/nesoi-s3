import { S3Client } from '@aws-sdk/client-s3';
import { S3Config } from './s3.config';
import { Service } from 'nesoi/lib/engine/apps/service';

export class S3Service<Name extends string = 's3'> extends Service<Name, S3Config> {

    static defaultName = 's3';

    public s3!: S3Client;

    public up() {
        this.s3 = new S3Client({
            endpoint: this.config.s3.endpoint,
            region: this.config.s3.region,
            credentials: {
                accessKeyId: this.config.s3.key,
                secretAccessKey: this.config.s3.secret
            },
        });
    }

    public down() {
    
    }

}
