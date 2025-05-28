import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/users.entity';
import { Account } from '../account/entities/account.entity';
import { Trainer } from '../trainer/entities/trainer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, Account, User, Trainer])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
