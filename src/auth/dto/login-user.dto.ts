import { IsString, IsStrongPassword } from 'class-validator';

export class LoginUserDto {
  /* 
  * not sure to implement this
  ? Investigate!
  @IsNumber()
  identityNumber: number; */
  @IsString()
  username: string;
  @IsString()
  @IsStrongPassword()
  password: string;
}
