import { UserRole } from './user-role.type';

export interface SocketUserPayload {
  userId: number | null; // 챗봇이면 null
  role: UserRole | 'chatbot';
  name: string; // 채팅창에 표시될 이름
  isBot?: boolean; // 봇 여부 명시 (선택)
}
