import { IsDecimal, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  walletnumber: string;

  @IsDecimal()
  @IsNotEmpty()
  amount: string;
}

export class WithdrawDto {
  @IsDecimal()
  @IsNotEmpty()
  amount: string;

  @IsNumber()
  @IsNotEmpty()
  paymentaccountid: number;
}
