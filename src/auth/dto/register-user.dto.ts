import {
  IsBoolean,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @MinLength(6)
  username: string;
  @IsString()
  @MinLength(1)
  firstName: string;
  @IsString()
  @MinLength(1)
  lastName: string;
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'The password must have a Uppercase, lowercase letter and a number',
  })
  password: string;
  @IsBoolean()
  isActive: boolean = true;
}
