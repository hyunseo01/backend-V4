import { Module } from '@nestjs/common';
import { MealController } from './meal.controller';
import { MealService } from './meal.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealRecord } from './entities/meal-record.entity';
import { Account } from '../../account/entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MealRecord, Account])],
  controllers: [MealController],
  providers: [MealService],
})
export class MealModule {}
