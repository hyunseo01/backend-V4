import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateMealRecordDto {
  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsNotEmpty()
  @MaxLength(1000)
  memo: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}
