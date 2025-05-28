import { IsDateString, Matches } from 'class-validator';

export class CreateReservationDto {
  @IsDateString()
  date: string; // 'YYYY-MM-DD'

  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
  time: string; // '10:00', '11:00' 등
}
