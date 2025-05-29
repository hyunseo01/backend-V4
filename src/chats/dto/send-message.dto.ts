export class SendMessageDto {
  chatId: number;
  content: string;
  isSystem?: boolean;
  photoUrl?: string | null;
}
