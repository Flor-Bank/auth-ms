import { IsNumber, IsString, IsStrongPassword } from 'class-validator';

export class RegisterUserDto {
  @IsNumber()
  identityNumber: number;
  @IsString()
  firstName: string;
  @IsString()
  lastName: string;
  @IsString()
  email: string;
  @IsString()
  @IsStrongPassword()
  password: string;
}
