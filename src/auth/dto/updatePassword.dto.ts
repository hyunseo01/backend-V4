import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(4)
  newPassword: string;

  @IsString()
  @MinLength(4)
  confirmPassword: string;
}
