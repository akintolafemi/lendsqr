import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { TransferService } from './transfers.service';
import { JwtService } from 'src/auth/jwt.service';

@Module({
  providers: [WalletsService, TransferService, JwtService],
  controllers: [WalletsController],
})
export class WalletsModule {}
