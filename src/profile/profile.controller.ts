import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/current-user.decorator';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ProfileService } from './profile.service';
import { ProfileInfoDto } from './dto/profile-info.dto';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('프로필')
@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  //유저 홈 페이지 (이름, 키/몸무게, PT권, 프로필사진)
  @Get('me')
  @Roles('user')
  @ApiOperation({
    summary: '유저 홈 조회 (이름, 키, 몸무게, PT권, 프로필사진)',
  })
  async getMyPage(@Req() req: RequestWithUser) {
    const data = await this.profileService.getUserHome(req.user.userId);
    return {
      message: '유저 홈 조회 성공',
      data,
    };
  }

  //프로필 테이블 조회 (이름, 키, 몸무게 등)
  @Get('info')
  @Roles('user')
  @ApiOperation({
    summary: '프로필 테이블 조회 (이름, 나이, 키, 몸무게, 상태메시지 등)',
  })
  async getProfileInfo(@Req() req: RequestWithUser) {
    const data = await this.profileService.getProfileInfo(req.user.userId);
    return {
      message: '프로필 정보 조회 성공',
      data,
    };
  }

  //프로필 최초 생성
  @Post()
  @Roles('user')
  @ApiOperation({ summary: '프로필 최초 생성 (키, 몸무게, 성별 등)' })
  @ApiOkResponse({ description: '프로필 생성 성공', type: ProfileInfoDto })
  async createProfile(
    @Req() req: RequestWithUser,
    @Body() dto: ProfileInfoDto,
  ) {
    const data = await this.profileService.createProfile(req.user.userId, dto);
    return {
      message: '프로필 생성 성공',
      data,
    };
  }

  //이름, 키, 몸무게 수정
  @Patch('info')
  @Roles('user')
  @ApiOperation({
    summary: '프로필 정보 수정 (이름, 키, 몸무게, 상태메시지 등)',
  })
  @ApiOkResponse({ description: '프로필 정보 수정 성공', type: ProfileInfoDto })
  async updateProfileInfo(
    @Req() req: RequestWithUser,
    @Body() dto: ProfileInfoDto,
  ) {
    const data = await this.profileService.updateProfile(req.user.userId, dto);
    return {
      message: '프로필 정보 수정 성공',
      data,
    };
  }

  //프로필 사진 업로드 또는 삭제(null)
  @Patch('photo')
  @Roles('user')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '프로필 사진 업로드 또는 삭제(null)' })
  async updateProfilePhoto(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    const data = await this.profileService.updatePhoto(
      req.user.userId,
      file ?? null,
    );
    return {
      message: file ? '프로필 사진 업로드 성공' : '프로필 사진 삭제 성공',
      data,
    };
  }

  //트레이너 간단 프로필 (이름 + 사진)
  @Get('trainer')
  @Roles('trainer')
  @ApiOperation({
    summary: '트레이너 간단 프로필 조회 (이름 + 기본 프로필 사진)',
  })
  async getTrainerProfile(@Req() req: RequestWithUser) {
    const data = await this.profileService.getTrainerInfo(req.user.userId);
    return {
      message: '트레이너 프로필 조회 성공',
      data,
    };
  }
}
