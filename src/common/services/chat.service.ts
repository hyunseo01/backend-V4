import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from '../../chats/entities/chats.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) {}

  async createChat(userId: number, trainerId: number): Promise<void> {
    const chat = this.chatRepository.create({ userId, trainerId });
    await this.chatRepository.save(chat);
  }
}
