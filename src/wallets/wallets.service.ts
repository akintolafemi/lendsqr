import { TransferDto, WithdrawDto } from '@dtos/wallets.dtos';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  ResponseManager,
  standardResponse,
} from '@utils/response.manager.utils';
import { KnexService } from 'src/knex/knex.service';
import RequestWithUser from 'src/types/request.with.user.type';
import { StatusText } from 'src/types/response.types';
import { TransferService } from './transfers.service';
import { GenerateRef } from '@utils/number.utils';

@Injectable()
export class WalletsService {
  constructor(
    private readonly dbService: KnexService,
    @Inject(REQUEST) private request: RequestWithUser,
    private readonly transferService: TransferService,
  ) {}

  async transferFunds(
    req: TransferDto,
  ): Promise<standardResponse | HttpException> {
    try {
      const wallet = await this.dbService
        .client('wallets')
        .select('*')
        .where({
          userid: this.request.user.id,
          deleted: false,
          status: 'active',
        })
        .first();

      if (!wallet)
        throw new HttpException('Invalid wallet', HttpStatus.NOT_FOUND, {
          cause: `wallet`,
          description: `User does not have a valid wallet`,
        });

      const walletAvailableBalance = Number(wallet['availablebalance']);
      const amount = Number(req.amount);
      if (amount > walletAvailableBalance)
        throw new HttpException('Wallet Balance', HttpStatus.FORBIDDEN, {
          cause: `insufficient balance`,
          description: `User does not have a enough balance`,
        });

      const walletnumber = req.walletnumber;

      const beneficiaryWallet = await this.dbService
        .client('wallets')
        .select('*')
        .where({
          walletnumber,
          deleted: false,
          status: 'active',
        })
        .first();

      if (!beneficiaryWallet)
        throw new HttpException('Invalid wallet', HttpStatus.NOT_FOUND, {
          cause: `wallet`,
          description: `Beneficiary wallet is not a valid wallet`,
        });

      const reference = GenerateRef(20);
      await this.transferService.debitAccount(
        wallet.walletnumber,
        amount,
        reference,
      );
      await this.transferService.creditAccount(
        beneficiaryWallet.walletnumber,
        amount,
        reference,
      );

      await this.dbService.client('transfers').insert({
        senderwalletid: wallet.id,
        beneficiarywalletid: beneficiaryWallet.id,
        amount,
        reference,
      });

      return ResponseManager.standardResponse({
        message: `Fund transfer successful!`,
        status: HttpStatus.CREATED,
        statusText: StatusText.SUCCESS,
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        {
          message: error?.response || 'Unknown error has occured',
          statusText: 'error',
          status: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          data: error,
        },
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async requestWithdrawal(
    req: WithdrawDto,
  ): Promise<standardResponse | HttpException> {
    try {
      const wallet = await this.dbService
        .client('wallets')
        .select('*')
        .where({
          userid: this.request.user.id,
          deleted: false,
          status: 'active',
        })
        .first();

      if (!wallet)
        throw new HttpException('Invalid wallet', HttpStatus.NOT_FOUND, {
          cause: `wallet`,
          description: `User does not have a valid wallet`,
        });

      const walletAvailableBalance = Number(wallet['availablebalance']);
      const amount = Number(req.amount);
      if (amount > walletAvailableBalance)
        throw new HttpException('Wallet Balance', HttpStatus.FORBIDDEN, {
          cause: `insufficient balance`,
          description: `User does not have a enough balance`,
        });

      const reference = GenerateRef(20);
      await this.transferService.transferToPaymentAccount(
        req.paymentaccountid,
        this.request.user.id,
        amount,
        reference,
      );

      return ResponseManager.standardResponse({
        message: `Withdrawal request processed successfully!`,
        status: HttpStatus.CREATED,
        statusText: StatusText.SUCCESS,
        data: {
          ...req,
          reference,
        },
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        {
          message: error?.response || 'Unknown error has occured',
          statusText: 'error',
          status: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          data: error,
        },
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
