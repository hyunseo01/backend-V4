export class ChatMessageDto {
  messageId: number;
  chatId: number;
  senderId: number;
  senderRole: 'user' | 'trainer';
  content: string;
  createdAt: Date;
}
