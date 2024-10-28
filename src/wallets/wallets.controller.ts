import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { TransferDto, WalletFundDto, WithdrawDto } from '@dtos/wallets.dtos';
import { UserGuard } from 'src/guards/user.guards';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly service: WalletsService) {}

  @UseGuards(UserGuard)
  @Post(`/transfer`)
  public async transferFunds(@Body() request: TransferDto) {
    return this.service.transferFunds(request);
  }

  @UseGuards(UserGuard)
  @Post(`/withdraw`)
  public async requestWithdrawal(@Body() request: WithdrawDto) {
    return this.service.requestWithdrawal(request);
  }

  @UseGuards(UserGuard)
  @Post(`/fund/initiate`)
  public async initiateWalletFunding(@Body() request: WalletFundDto) {
    return this.service.initiateWalletFunding(request);
  }
}
