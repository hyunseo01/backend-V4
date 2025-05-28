import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadRecordPhotoDto {
  @ApiProperty({ enum: ['meal', 'exercise'], description: '기록 타입' })
  @IsIn(['meal', 'exercise'])
  type: 'meal' | 'exercise';
}
