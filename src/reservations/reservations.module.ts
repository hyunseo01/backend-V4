import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../schedules/entities/schedules.entity';
import { Reservation } from './entities/reservation.entity';
import { User } from '../users/entities/users.entity';
import { Trainer } from '../trainer/entities/trainer.entity';
import { Account } from '../account/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule, Reservation, User, Trainer, Account]),
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
