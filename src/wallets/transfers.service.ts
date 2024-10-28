import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { KnexService } from 'src/knex/knex.service';
import { paymentData } from 'src/types/paystack.types';

@Injectable()
export class TransferService {
  constructor(
    private readonly dbService: KnexService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async debitAccount(walletnumber: string, amount: number, reference: string) {
    try {
      await this.dbService.client.transaction(async (trx) => {
        const wallet = await trx('wallets')
          .select('*')
          .where({
            walletnumber,
            deleted: false,
            status: 'active',
          })
          .first();

        const availablebalance = Number(wallet['availablebalance']);
        const newAvailableBalance = availablebalance - amount;
        const balance = Number(wallet['balance']);
        const newBalance = balance - amount;
        await trx('wallets')
          .update({
            availablebalance: newAvailableBalance,
            balance: newBalance,
          })
          .where('id', wallet.id);

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

  async creditAccount(walletnumber: string, amount: number, reference: string) {
    try {
      const wallet = await this.dbService
        .client('wallets')
        .select('*')
        .where({
          walletnumber,
          deleted: false,
          status: 'active',
        })
        .first();

      const availablebalance = Number(wallet['availablebalance']);
      const newAvailableBalance = availablebalance + amount;
      const balance = Number(wallet['balance']);
      const newBalance = balance + amount;
      await this.dbService
        .client('wallets')
        .update({
          availablebalance: newAvailableBalance,
          balance: newBalance,
        })
        .where('id', wallet.id);

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

  async transferToPaymentAccount(
    paymentaccountid: number,
    userid: number,
    amount: number,
    reference: string,
  ) {
    try {
      const paymentaccount = await this.dbService
        .client('paymentaccounts')
        .select('*')
        .where({
          id: paymentaccountid,
          userid,
          deleted: false,
        })
        .first();

      if (!paymentaccount)
        throw new HttpException(
          'Invalid payment account',
          HttpStatus.NOT_FOUND,
          {
            cause: `payment account`,
            description: `Selected payment account is invalid`,
          },
        );

      const payment: paymentData = {
        amount: Number(amount) * 100,
        reason: `Account withdrawal`,
        recipient: `${paymentaccount?.recipientcode}`,
        reference: `${reference}`,
      };
      this.eventEmitter.emit(`transfer.single`, payment);

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
