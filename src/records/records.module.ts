import { Module } from '@nestjs/common';
import { ExerciseModule } from './exercise/exercise.module';
import { MealModule } from './meal/meal.module';
import { RecordImageController } from './record.controller';
import { RecordImageService } from './record.service';

@Module({
  imports: [ExerciseModule, MealModule],
  controllers: [RecordImageController],
  providers: [RecordImageService],
})
export class RecordsModule {}
