import { Module } from '@nestjs/common';
import { MealController } from './meal.controller';
import { MealService } from './meal.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealRecord } from './entities/meal-record.entity';
import { Account } from '../../account/entities/account.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([MealRecord, Account]), HttpModule],
  controllers: [MealController],
  providers: [MealService],
})
export class MealModule {}
