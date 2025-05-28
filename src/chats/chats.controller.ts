import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ChatsService } from './chats.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('채팅')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatService: ChatsService) {}

  @Get('rooms')
  @Roles('trainer')
  @ApiOperation({ summary: '트레이너 전용 채팅방 리스트 조회' })
  getTrainerChatRooms(@Req() req: RequestWithUser) {
    return this.chatService.getChatRoomsForTrainer(req.user.userId);
  }

  @Get('my')
  @Roles('user')
  @ApiOperation({ summary: '유저 전용: 내 채팅방 ID 조회' })
  async getMyChatRoom(@Req() req: RequestWithUser) {
    return this.chatService.getChatRoomForUser(req.user.userId);
  }

  @Get('messages')
  @Roles('user', 'trainer')
  @ApiOperation({ summary: '채팅 메시지 조회' })
  async getMessages(
    @Req() req: RequestWithUser,
    @Query('roomId') roomIdRaw: string,
    @Query('cursor') cursorRaw?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const roomId = Number(roomIdRaw);
    const cursor = cursorRaw ? Number(cursorRaw) : undefined;
    const limit = limitRaw ? Number(limitRaw) : 20;

    if (isNaN(roomId) || limit <= 0) {
      throw new BadRequestException(
        'roomId 또는 limit 값이 유효하지 않습니다.',
      );
    }

    return this.chatService.getMessages({
      roomId,
      cursor,
      limit,
      accountId: req.user.userId,
      role: req.user.role as 'user' | 'trainer',
    });
  }
}
