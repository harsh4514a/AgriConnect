import { createHash } from 'node:crypto';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '../../config/config.service';

interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

interface CloudinaryUploadResponse {
  secure_url?: string;
}

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class ListingImagesService {
  constructor(private readonly config: ConfigService) {}

  async upload(userId: string, files: UploadedImageFile[]): Promise<string[]> {
    if (!files?.length) {
      throw new BadRequestException('Select at least one image to upload');
    }

    if (files.length > MAX_IMAGE_COUNT) {
      throw new BadRequestException(`You can upload up to ${MAX_IMAGE_COUNT} images`);
    }

    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Cloudinary image storage is not configured on the API',
      );
    }

    const folderRoot = this.config.get('CLOUDINARY_MARKETPLACE_FOLDER')?.trim()
      || 'agriconnect/listings';
    const folder = `${folderRoot}/${userId}`;

    return Promise.all(
      files.map(async (file) => {
        this.validateImage(file);

        if (file.buffer.length > MAX_IMAGE_SIZE) {
          throw new BadRequestException('Each image must be 5 MB or smaller');
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const signatureParams = { folder, timestamp: String(timestamp) };
        const signatureString = Object.entries(signatureParams)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, value]) => `${key}=${value}`)
          .join('&');
        const signature = createHash('sha1')
          .update(`${signatureString}${apiSecret}`)
          .digest('hex');

        const formData = new FormData();
        formData.append(
          'file',
          new Blob([Uint8Array.from(file.buffer)], { type: file.mimetype }),
          file.originalname,
        );
        formData.append('api_key', apiKey);
        formData.append('timestamp', String(timestamp));
        formData.append('folder', folder);
        formData.append('signature', signature);

        let response: Response;
        try {
          response = await fetch(
            `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
            {
              method: 'POST',
              body: formData,
              signal: AbortSignal.timeout(60_000),
            },
          );
        } catch {
          throw new BadGatewayException('Could not connect to Cloudinary');
        }

        const result = (await response.json().catch(() => null)) as
          | CloudinaryUploadResponse
          | null;

        if (!response.ok || !result?.secure_url) {
          throw new BadGatewayException('Cloudinary could not store the image');
        }

        return result.secure_url;
      }),
    );
  }

  private validateImage(file: UploadedImageFile): void {
    const buffer = file.buffer;
    const isJpeg =
      file.mimetype === 'image/jpeg' &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff;
    const isPng =
      file.mimetype === 'image/png' &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp =
      file.mimetype === 'image/webp' &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are supported');
    }
  }
}
