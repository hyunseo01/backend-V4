import { Controller, Post, Body, Req, UseGuards, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SignupUserDto } from './dto/signup-user.dto';
import { SignupTrainerDto } from './dto/signup-trainer.dto';
import { SigninDto } from './dto/signin.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/current-user.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/user')
  @ApiOperation({ summary: '일반 회원 가입' })
  signupUser(@Body() dto: SignupUserDto) {
    return this.authService.signupUser(dto);
  }

  @Post('signup/trainer')
  @ApiOperation({ summary: '트레이너 등록' })
  signupTrainer(@Body() dto: SignupTrainerDto) {
    return this.authService.signupTrainer(dto);
  }

  @Post('signin')
  @ApiOperation({ summary: '로그인' })
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @Post('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '비밀번호 변경' })
  updatePassword(@Body() dto: UpdatePasswordDto, @Req() req: RequestWithUser) {
    return this.authService.updatePassword(req.user.userId, dto);
  }

  @Put('withdraw')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: '회원 탈퇴 (User만 가능)' })
  withdraw(@Req() req: RequestWithUser) {
    console.log('토큰에서 추출된 userId:', req.user.userId);
    return this.authService.withdraw(req.user.userId, req.user.role);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Access token 재발급' })
  async refreshAccessToken(@Body() dto: RefreshTokenDto) {
    const token = await this.authService.reissueAccessToken(dto.refreshToken);
    return { accessToken: token };
  }
}
