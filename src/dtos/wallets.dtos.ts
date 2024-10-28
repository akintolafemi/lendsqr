import { IsDecimal, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class WalletFundDto {
  @IsDecimal()
  @IsNotEmpty()
  amount: string;
}

export class TransferDto extends WalletFundDto {
  @IsString()
  @IsNotEmpty()
  walletnumber: string;
}

export class WithdrawDto extends WalletFundDto {
  @IsNumber()
  @IsNotEmpty()
  paymentaccountid: number;
}
