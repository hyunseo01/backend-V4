import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

export function validateImageFile(file: Express.Multer.File): void {
  if (!file || !file.buffer || !file.originalname || !file.mimetype) {
    throw new BadRequestException(
      '파일이 존재하지 않거나 형식이 잘못되었습니다.',
    );
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestException(
      '허용되지 않는 이미지 형식입니다. (jpg, png, webp만 가능)',
    );
  }

  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeInBytes) {
    throw new BadRequestException('이미지 파일은 5MB를 초과할 수 없습니다.');
  }
}

export function getImageKey(
  type: 'profile' | 'meal' | 'exercise',
  accountId: number,
  originalname: string,
): string {
  const ext = extname(originalname) || '.jpg';
  const timestamp = Date.now();
  const prefix = type === 'profile' ? 'profiles' : `${type}-records`;
  return `${prefix}/${accountId}-${timestamp}${ext}`;
}
