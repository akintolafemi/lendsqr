import { ValidatePassword } from '@validators/custom.validator';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { GENDER_TYPES } from 'src/constants/auth.constants';

export class CreateAccountDto {
  @IsEmail()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: 'password must be a minimum of 8 alphanumeric characters',
  })
  @ValidatePassword()
  password: string;

  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  mobile: string;

  @IsDateString()
  @IsNotEmpty()
  dateofbirth: string;

  @IsEnum(GENDER_TYPES, {
    message: `gender type must be one of ${GENDER_TYPES.toString()}`,
  })
  gender: string;
}
