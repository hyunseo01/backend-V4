import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ReadMessageDto } from './dto/read-message.dto';
import { extractUserFromSocket } from '../auth/utils/socket-auth.helper';
import { ChatMessageDto } from '../messages/dto/chat-message.dto';

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
    console.log(`WebSocket 연결 종료: ${client.data?.accountId}`);
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

    const payload: ChatMessageDto = {
      messageId: saved.id,
      chatId: saved.chatId,
      senderId: saved.senderId,
      senderRole: role,
      content: saved.content,
      createdAt: saved.createdAt,
    };

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
