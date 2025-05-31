import { forwardRef, Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../schedules/entities/schedules.entity';
import { Reservation } from './entities/reservation.entity';
import { User } from '../users/entities/users.entity';
import { Trainer } from '../trainer/entities/trainer.entity';
import { Account } from '../account/entities/account.entity';
import { Chat } from '../chats/entities/chats.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatsModule } from '../chats/chats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Schedule,
      Reservation,
      User,
      Trainer,
      Account,
      Chat,
    ]),
    forwardRef(() => NotificationsModule),
    forwardRef(() => ChatsModule),
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
