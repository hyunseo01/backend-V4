import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/current-user.decorator';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { UploadRecordPhotoDto } from './dto/upload-record-photo.dto';
import { RecordImageService } from './record.service';

@ApiTags('Record Image')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
@Controller('records/photo')
export class RecordImageController {
  constructor(private readonly recordImageService: RecordImageService) {}

  @Post()
  @ApiOperation({ summary: '식단/운동 기록 이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadRecordImage(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadRecordPhotoDto,
  ): Promise<{ message: string; data: string }> {
    const url = await this.recordImageService.uploadRecordImage(
      req.user.userId,
      file,
      body.type,
    );
    return {
      message: '기록용 이미지 업로드 성공',
      data: url,
    };
  }
}
