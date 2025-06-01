import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ReadMessageDto } from './dto/read-message.dto';
import { extractUserFromSocket } from '../auth/utils/socket-auth.helper';
import { ChatMessageDto } from '../messages/dto/chat-message.dto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface SocketWithAuth extends Socket {
  data: {
    accountId: number;
    role: 'user' | 'trainer' | 'admin';
  };
}

@WebSocketGateway({ namespace: '/chats', cors: true })
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatsService: ChatsService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: SocketWithAuth) {
    try {
      const { accountId, role } = extractUserFromSocket(
        client,
        this.jwtService,
      );
      client.data.accountId = accountId;
      client.data.role = role;
      client.join(`user:${accountId}`);
      console.log(`WebSocket 연결 성공: ${accountId} (${role})`);
    } catch (err) {
      client.emit('auth.error', {
        code: 401,
        message: err instanceof Error ? err.message : 'WebSocket 인증 실패',
      });
      console.error('WebSocket 인증 실패:', err);
      client.disconnect();
    }
  }

  handleDisconnect(client: SocketWithAuth) {
    const accountId = client.data?.accountId;
    const role = client.data?.role;

    if (!accountId) {
      console.log('연결 종료 - 인증 정보 없음');
      return;
    }

    // 로그
    console.log(`WebSocket 연결 종료: ${accountId} (${role})`);

    // 1. 유저별 개인 room에서 leave
    client.leave(`user:${accountId}`);

    // 2. 이 클라이언트가 참여한 모든 방에서 강제 leave
    for (const room of client.rooms) {
      if (room !== client.id) {
        client.leave(room);
      }
    }

    // 3. 트레이너일 경우: 트레이너의 채팅방 리스트 갱신
    if (role === 'trainer') {
      this.chatsService
        .getChatRoomsForTrainer(accountId)
        .then((updatedRooms) => {
          this.server
            .to(`user:${accountId}`)
            .emit('roomList.update', updatedRooms);
        })
        .catch((err) => {
          console.error('트레이너 리스트 갱신 실패:', err);
        });
    }

    // 4. (선택) 상대방에게 알림 보낼 수 있음 (예: "상대가 오프라인 됐어요")
  }

  @SubscribeMessage('message.send')
  async handleSendMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    const accountId = client.data.accountId;
    const role = client.data.role as 'user' | 'trainer';

    const saved = await this.chatsService.saveMessage({
      chatId: dto.chatId,
      content: dto.content,
      senderId: accountId,
      isSystem: dto.isSystem ?? false,
    });

    const photoUrl = await this.chatsService.getSenderPhotoUrl(accountId, role);

    const payload: ChatMessageDto = {
      messageId: saved.id,
      chatId: saved.chatId,
      senderId: saved.senderId,
      senderRole: role,
      content: saved.content,
      createdAt: dayjs(saved.createdAt).tz('Asia/Seoul').format(),
      photoUrl,
    };
    console.log('테스트: ', dayjs(saved.createdAt).tz('Asia/Seoul').format());

    client.emit('message.receive', payload);

    const chat = await this.chatsService.getChatWithUsers(dto.chatId);
    const receiverId =
      accountId === chat.user?.account?.id
        ? chat.trainer?.account?.id
        : chat.user?.account?.id;

    if (receiverId) {
      this.server.to(`user:${receiverId}`).emit('message.receive', payload);
    }

    const trainerAccountId = chat.trainer?.account?.id;
    if (trainerAccountId) {
      const updatedRooms =
        await this.chatsService.getChatRoomsForTrainer(trainerAccountId);
      this.server
        .to(`user:${trainerAccountId}`)
        .emit('roomList.update', updatedRooms);
    }
  }

  @SubscribeMessage('message.read')
  async handleReadMessage(
    @MessageBody() dto: ReadMessageDto,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    const accountId = client.data.accountId;
    const role = client.data.role as 'user' | 'trainer';

    const result = await this.chatsService.markMessagesAsRead({
      chatId: dto.chatId,
      accountId,
      lastReadMessageId: dto.lastReadMessageId,
    });

    if (result.affectedMessages > 0) {
      const chat = await this.chatsService.getChatWithUsers(dto.chatId);
      const otherUserId =
        accountId === chat.user?.account?.id
          ? chat.trainer?.account?.id
          : chat.user?.account?.id;

      if (otherUserId) {
        this.server.to(`user:${otherUserId}`).emit('message.readStatusUpdate', {
          chatId: dto.chatId,
          lastReadMessageId: dto.lastReadMessageId,
          readBy: accountId,
          readerRole: role,
        });
      }

      if (chat.trainer?.account?.id) {
        const trainerRooms = await this.chatsService.getChatRoomsForTrainer(
          chat.trainer.account.id,
        );
        this.server
          .to(`user:${chat.trainer.account.id}`)
          .emit('roomList.update', trainerRooms);
      }
    }

    client.emit('message.readConfirm', {
      success: true,
      chatId: dto.chatId,
      lastReadMessageId: dto.lastReadMessageId,
      affectedCount: result.affectedMessages,
    });
  }

  @SubscribeMessage('join.room')
  handleJoinRoom(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    client.join(`chat:${data.chatId}`);
    console.log(`소켓 ${client.id} → chat:${data.chatId} 방 join`);
  }
}
