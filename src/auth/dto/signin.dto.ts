import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class SigninDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsString()
  @IsIn(['user', 'trainer'])
  role: string;
}
