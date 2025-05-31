import { forwardRef, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Account } from '../account/entities/account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReservationsModule } from '../reservations/reservations.module';
import { ChatsModule } from '../chats/chats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Reservation]),
    forwardRef(() => ReservationsModule),
    forwardRef(() => ChatsModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
