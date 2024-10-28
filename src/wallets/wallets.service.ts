import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  ResponseManager,
  standardResponse,
} from '@utils/response.manager.utils';
import { KnexService } from 'src/knex/knex.service';
import RequestWithUser from 'src/types/request.with.user.type';
import { StatusText } from 'src/types/response.types';
import { TransferService } from './transfers.service';
import { GenerateRef } from '@utils/number.utils';
import { paystackUtil } from '@utils/paystack.utils';
import { TransferDto, WalletFundDto, WithdrawDto } from '@dtos/wallets.dtos';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class WalletsService {
  constructor(
    private readonly dbService: KnexService, // Knex service for database interaction
    @Inject(REQUEST) private request: RequestWithUser, // Injected request object to access user information
    private readonly transferService: TransferService, // Transfer service for wallet operations
  ) {}

  // Method to transfer funds between wallets
  async transferFunds(
    req: TransferDto, // DTO to validate and type the transfer request payload
  ): Promise<standardResponse | HttpException> {
    try {
      // Fetch user's wallet with active status
      const wallet = await this.dbService
        .client('wallets')
        .select('*')
        .where({
          userid: this.request.user.id,
          deleted: false,
          status: 'active',
        })
        .first();

      // Check if user's wallet exists
      if (!wallet)
        throw new HttpException('Invalid wallet', HttpStatus.NOT_FOUND, {
          cause: `wallet`,
          description: `User does not have a valid wallet`,
        });

      const walletAvailableBalance = Number(wallet['availablebalance']);
      const amount = Number(req.amount);

      // Check if user's wallet has enough balance for the transfer
      if (amount > walletAvailableBalance)
        throw new HttpException('Wallet Balance', HttpStatus.FORBIDDEN, {
          cause: `insufficient balance`,
          description: `User does not have enough balance`,
        });

      const walletnumber = req.walletnumber;

      // Verify that the recipient's wallet is active
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
          description: `Beneficiary wallet is not valid`,
        });

      const reference = GenerateRef(20); // Generate unique reference for transaction

      // Debit sender's wallet
      await this.transferService.debitAccount(
        wallet.walletnumber,
        amount,
        reference,
      );

      // Credit recipient's wallet
      await this.transferService.creditAccount(
        beneficiaryWallet.walletnumber,
        amount,
        reference,
      );

      // Log the transfer in the database
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
          message: error?.response || 'Unknown error has occurred',
          statusText: 'error',
          status: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          data: error,
        },
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Method to handle user's withdrawal request
  async requestWithdrawal(
    req: WithdrawDto, // DTO to validate and type the withdrawal request payload
  ): Promise<standardResponse | HttpException> {
    try {
      // Fetch user's active wallet
      const wallet = await this.dbService
        .client('wallets')
        .select('*')
        .where({
          userid: this.request.user.id,
          deleted: false,
          status: 'active',
        })
        .first();

      // Check if user's wallet exists
      if (!wallet)
        throw new HttpException('Invalid wallet', HttpStatus.NOT_FOUND, {
          cause: `wallet`,
          description: `User does not have a valid wallet`,
        });

      const walletAvailableBalance = Number(wallet['availablebalance']);
      const amount = Number(req.amount);

      // Check if user's wallet has enough balance for the withdrawal
      if (amount > walletAvailableBalance)
        throw new HttpException('Wallet Balance', HttpStatus.FORBIDDEN, {
          cause: `insufficient balance`,
          description: `User does not have enough balance`,
        });

      const reference = GenerateRef(20); // Generate unique reference for the transaction

      // Perform the transfer to the external payment account
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
          message: error?.response || 'Unknown error has occurred',
          statusText: 'error',
          status: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          data: error,
        },
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Method to initiate funding of a user's wallet
  async initiateWalletFunding(
    req: WalletFundDto, // DTO to validate and type the funding request payload
  ): Promise<standardResponse | HttpException> {
    try {
      const reference = GenerateRef(20); // Generate a unique reference for the transaction
      const amount = Number(req.amount);

      // Log the funding transaction with 'pending' status
      await this.dbService.client('transactions').insert({
        userid: this.request.user.id,
        amount,
        reference,
        status: 'pending',
      });

      // Send request to Paystack to initialize the transaction
      const paystackReq = await paystackUtil(`transaction/initialize`, `POST`, {
        email: this.request.user.username,
        amount: amount * 100, // Convert to minor currency unit
        currency: 'NGN',
        reference,
        metadata: JSON.stringify({
          email: this.request.user.username,
          id: this.request.user.id,
        }),
      });

      return ResponseManager.standardResponse({
        message: `Wallet funding initiated successfully!`,
        status: HttpStatus.OK,
        statusText: StatusText.SUCCESS,
        data: paystackReq,
      });
    } catch (error) {
      throw new HttpException(
        {
          message: error?.response || 'Unknown error has occurred',
          statusText: 'error',
          status: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          data: error,
        },
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
