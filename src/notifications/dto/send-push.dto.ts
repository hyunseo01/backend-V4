import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SendPushDto {
  @IsNumber()
  accountId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}
