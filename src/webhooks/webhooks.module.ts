import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { TransferService } from 'src/wallets/transfers.service';

@Module({
  providers: [WebhooksService, TransferService],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
