import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { SavePushTokenDto } from './dto/save-push-token.dto';
import { NotificationsService } from './notifications.service';
import { SendPushDto } from './dto/send-push.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('token')
  @UseGuards(JwtAuthGuard)
  @Roles('user', 'trainer') // 또는 admin 포함해도 되고
  async savePushToken(
    @Req() req: RequestWithUser,
    @Body() dto: SavePushTokenDto,
  ) {
    const accountId = req.user.userId;
    await this.notificationsService.savePushToken(accountId, dto.expoPushToken);
    return { message: '푸시 토큰 저장 완료' };
  }

  @Post('send')
  async sendTestNotification(@Body() dto: SendPushDto) {
    await this.notificationsService.sendNotificationToAccount(
      dto.accountId,
      dto.title,
      dto.body,
    );
    return { message: '푸시 알림 전송 완료' };
  }
}
