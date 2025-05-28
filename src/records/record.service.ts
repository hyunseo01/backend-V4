import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  getImageKey,
  validateImageFile,
} from '../common/utils/validate-image.util';

@Injectable()
export class RecordImageService {
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION ?? '',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  async uploadRecordImage(
    accountId: number,
    file: Express.Multer.File,
    type: 'meal' | 'exercise',
  ): Promise<string> {
    validateImageFile(file);
    const key = getImageKey(type, accountId, file.originalname);

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET ?? '',
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3.send(command);

    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }
}
