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
    private readonly dbService: KnexService, // Knex service to interact with the database
    private readonly transerService: TransferService, // Service to handle wallet transfers
  ) {}

  // Method to handle incoming PayStack webhooks
  public async payStackWebhooks(
    request: RawBodyRequest<Request>, // Raw request containing the webhook data
  ): Promise<standardResponse | HttpException> {
    try {
      // Parse the request body for event details
      const body: any = request.body;
      const event = body.event; // Event type (e.g., charge.success)
      const data = body.data; // Data associated with the event
      const amount = data?.amount / 100 || 0; // Amount involved in the transaction, normalized
      const reference = data?.reference || data?.transaction_reference; // Transaction reference
      const metadata = data?.metadata; // Additional metadata if available

      switch (event) {
        case 'charge.success': // Handle successful charge events
          // Find user by email in metadata and get their associated wallet
          const user = await this.dbService
            .client('users')
            .leftJoin('wallets', 'users.id', 'wallets.userid')
            .select('users.id', 'wallets.walletnumber')
            .where('users.username', metadata.email)
            .first();

          // Check if the transaction already exists for this user and reference
          const transaction = await this.dbService
            .client('transactions')
            .select('*')
            .where({
              userid: user.id,
              reference: reference,
            })
            .first();

          // Update the transaction status to 'successful'
          await this.dbService
            .client('transactions')
            .update({
              status: 'successful',
            })
            .where('id', transaction.id);

          // Credit the user's wallet with the specified amount
          await this.transerService.creditAccount(
            user.walletnumber, // User's wallet number
            Number(amount), // Amount to credit
            reference, // Transaction reference for record-keeping
            false, // Indicates this is not an internal transfer
          );

          break;

        default:
          break;
      }

      // Return success response after processing the webhook
      return ResponseManager.standardResponse({
        message: `Webhook received and processed successfully`,
        statusText: StatusText.SUCCESS,
        status: HttpStatus.OK,
      });
    } catch (error) {
      console.log(error); // Log any unexpected errors for debugging
      // Throw an HTTP exception in case of an error
      throw new HttpException(
        {
          message: 'Unknown error has occurred', // Error message
          statusText: 'error', // Status text to describe the error
          status: HttpStatus.INTERNAL_SERVER_ERROR, // HTTP status code 500
          data: error, // Error details for further inspection
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
