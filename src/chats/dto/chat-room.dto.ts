export class ChatRoomDto {
  chatId: number;
  userId: number;
  userName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  photoUrl: string | null;
}
