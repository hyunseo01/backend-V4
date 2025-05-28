import { Module } from '@nestjs/common';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseRecord } from './entities/exercise-record.entity';
import { Account } from '../../account/entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExerciseRecord, Account])],
  controllers: [ExerciseController],
  providers: [ExerciseService],
})
export class ExerciseModule {}
