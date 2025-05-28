import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { Account } from '../account/entities/account.entity';
import { User } from '../users/entities/users.entity';
import { Trainer } from '../trainer/entities/trainer.entity';
import { TrainerAssignService } from '../common/services/trainer-assign.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, User, Trainer]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? '',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TrainerAssignService],
  exports: [JwtModule],
})
export class AuthModule {}
