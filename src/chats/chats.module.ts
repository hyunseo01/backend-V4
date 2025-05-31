import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chats.entity';
import { Trainer } from '../trainer/entities/trainer.entity';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { Message } from '../messages/entities/messages.entity';
import { User } from '../users/entities/users.entity';
import { ChatsGateway } from './chats.gateway';
import { AuthModule } from '../auth/auth.module';
import { Profile } from '../profile/entities/profile.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, Trainer, Message, User, Profile]),
    forwardRef(() => AuthModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsGateway],
  exports: [ChatsService],
})
export class ChatsModule {}
