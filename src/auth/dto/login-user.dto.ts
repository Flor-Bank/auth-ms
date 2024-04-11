import { /* IsNumber */ IsString, IsStrongPassword } from 'class-validator';

export class LoginUserDto {
  /* @IsNumber()
  identityNumber: number; */
  @IsString()
  email: string;
  @IsString()
  @IsStrongPassword()
  password: string;
}
