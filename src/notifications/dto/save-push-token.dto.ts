import { IsString } from 'class-validator';

export class SavePushTokenDto {
  @IsString()
  expoPushToken: string;
}
