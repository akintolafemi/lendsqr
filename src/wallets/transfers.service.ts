import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { KnexService } from 'src/knex/knex.service';
import { EventType } from 'src/types/event.types';
import { paymentData } from 'src/types/paystack.types';

@Injectable()
export class TransferService {
  constructor(
    private readonly dbService: KnexService, // Database service using Knex for SQL operations
    private readonly eventEmitter: EventEmitter2, // Event emitter for emitting payment events
  ) {}

  // Method to debit an account by a specified amount
  async debitAccount(walletnumber: string, amount: number, reference: string) {
    try {
      // Start a database transaction to ensure atomicity
      await this.dbService.client.transaction(async (trx) => {
        // Fetch active wallet details using the wallet number
        const wallet = await trx('wallets')
          .select('*')
          .where({
            walletnumber,
            deleted: false,
            status: 'active',
          })
          .first();

        // Calculate new balances after debit
        const availablebalance = Number(wallet['availablebalance']);
        const newAvailableBalance = availablebalance - amount;
        const balance = Number(wallet['balance']);
        const newBalance = balance - amount;

        // Update the wallet's balance and available balance
        await trx('wallets')
          .update({
            availablebalance: newAvailableBalance,
            balance: newBalance,
          })
          .where('id', wallet.id);

        // Record the debit transaction in the transactions table
        await this.dbService.client('transactions').insert({
          userid: wallet.userid,
          amount,
          reference,
          type: 'debit',
        });
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Debit wallet',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: `wallet`,
          description: `Unable to debit wallet`,
        },
      );
    }
  }

  // Method to credit an account by a specified amount, with optional transaction recording
  async creditAccount(
    walletnumber: string,
    amount: number,
    reference: string,
    saveTransaction = true, // Optional flag to decide whether to save the transaction
  ) {
    try {
      // Fetch active wallet details using the wallet number
      const wallet = await this.dbService
        .client('wallets')
        .select('*')
        .where({
          walletnumber,
          deleted: false,
          status: 'active',
        })
        .first();

      // Calculate new balances after credit
      const availablebalance = Number(wallet['availablebalance']);
      const newAvailableBalance = availablebalance + amount;
      const balance = Number(wallet['balance']);
      const newBalance = balance + amount;

      // Update the wallet's balance and available balance
      await this.dbService
        .client('wallets')
        .update({
          availablebalance: newAvailableBalance,
          balance: newBalance,
        })
        .where('id', wallet.id);

      // If specified, record the credit transaction in the transactions table
      if (saveTransaction)
        await this.dbService.client('transactions').insert({
          userid: wallet.userid,
          amount,
          reference,
          type: 'credit',
        });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Credit wallet',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: `wallet`,
          description: `Unable to credit wallet`,
        },
      );
    }
  }

  // Method to transfer funds to an external payment account
  async transferToPaymentAccount(
    paymentaccountid: number, // ID of the payment account
    userid: number, // User ID for validating account ownership
    amount: number, // Amount to transfer
    reference: string, // Unique transaction reference
  ) {
    try {
      // Fetch the user's active payment account details
      const paymentaccount = await this.dbService
        .client('paymentaccounts')
        .select('*')
        .where({
          id: paymentaccountid,
          userid,
          deleted: false,
        })
        .first();

      // Check if payment account exists
      if (!paymentaccount)
        throw new HttpException(
          'Invalid payment account',
          HttpStatus.NOT_FOUND,
          {
            cause: `payment account`,
            description: `Selected payment account is invalid`,
          },
        );

      // Prepare payment data to send to the payment processing service
      const payment: paymentData = {
        amount: Number(amount) * 100, // Convert to minor currency unit (e.g., kobo)
        reason: `Account withdrawal`,
        recipient: `${paymentaccount?.recipientcode}`, // Recipient code for external transfer
        reference: `${reference}`, // Reference ID for tracking
      };

      // Emit an event for the external transfer
      this.eventEmitter.emit(EventType.TRANSFER_WITH_PAYSTACK, payment);

      // Record the withdrawal transaction in the transactions table
      await this.dbService.client('transactions').insert({
        userid: paymentaccount.userid,
        amount,
        reference,
        type: 'withdrawal',
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error?.cause || 'fund transfer',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error?.options || {
          cause: `wallet`,
          description: `Unable to transfer from wallet`,
        },
      );
    }
  }
}
