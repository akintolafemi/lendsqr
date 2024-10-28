import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import PayStackGuard from 'src/guards/paystack.guards';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  @UseGuards(PayStackGuard)
  @Post('/paystack')
  public async payStackWebhooks(@Request() request: Request) {
    return this.service.payStackWebhooks(request);
  }
}
