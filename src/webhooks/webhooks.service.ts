import {
  HttpException,
  HttpStatus,
  Injectable,
  RawBodyRequest,
} from '@nestjs/common';
import {
  ResponseManager,
  standardResponse,
} from '@utils/response.manager.utils';
import { KnexService } from 'src/knex/knex.service';
import { TransferService } from 'src/wallets/transfers.service';
import { StatusText } from 'src/types/response.types';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly dbService: KnexService,
    private readonly transerService: TransferService,
  ) {}

  public async payStackWebhooks(
    request: RawBodyRequest<Request>,
  ): Promise<standardResponse | HttpException> {
    try {
      const body: any = request.body;
      const event = body.event;
      const data = body.data;
      const amount = data?.amount / 100 || 0;
      const reference = data?.reference || data?.transaction_reference;
      const metadata = data?.metadata;

      switch (event) {
        case 'charge.success':
          const user = await this.dbService
            .client('users')
            .leftJoin('wallets', 'users.id', 'wallets.userid')
            .select('users.id', 'wallets.walletnumber')
            .where('users.username', metadata.email)
            .first();

          const transaction = await this.dbService
            .client('transactions')
            .select('*')
            .where({
              userid: user.id,
              reference: reference,
            })
            .first();
          await this.dbService
            .client('transactions')
            .update({
              status: 'successful',
            })
            .where('id', transaction.id);

          await this.transerService.creditAccount(
            user.walletnumber,
            Number(amount),
            reference,
            false,
          );

          break;

        default:
          break;
      }
      return ResponseManager.standardResponse({
        message: `Webhook received and processed successfully`,
        statusText: StatusText.SUCCESS,
        status: HttpStatus.OK,
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        {
          message: 'Unknown error has occured',
          statusText: 'error',
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          data: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
