import { IsDateString } from 'class-validator';

export class GetAvailableScheduleDto {
  @IsDateString()
  date: string;
}
