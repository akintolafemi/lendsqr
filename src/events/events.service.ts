import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GenerateWalletNumber } from '@utils/number.utils';
import { paystackUtil } from '@utils/paystack.utils';
import { KnexService } from 'src/knex/knex.service';
import { EventType } from 'src/types/event.types';
import { paymentData } from 'src/types/paystack.types';

@Injectable()
export class EventsService {
  constructor(private readonly dbService: KnexService) {}
  @OnEvent(EventType.AUDIT_LOG)
  async setAuditLog(data: {
    userid: number;
    action: string;
    note: string;
    ip?: string;
  }) {
    try {
      await this.dbService.client('auditlogs').insert({
        ...data,
      });
    } catch (e) {
      console.log(e);
    }
  }

  @OnEvent(EventType.USER_CREATED)
  async userCreated(data: {
    userid: number;
    firstname: string;
    username: string;
  }) {
    try {
      //logic to send welcome email and verification link

      //generate wallet number and save
      const walletnumber = GenerateWalletNumber();
      await this.dbService.client('wallets').insert({
        userid: data.userid,
        walletnumber,
      });
    } catch (e) {
      console.log(e);
    }
  }

  @OnEvent(EventType.TRANSFER_WITH_PAYSTACK)
  async singleTransfer(data: paymentData) {
    try {
      //use paystack service to transfer
      await paystackUtil(`transfer`, `POST`, {
        currency: 'NGN',
        source: 'balance',
        ...data,
      });
    } catch (e) {
      console.log(e);
    }
  }
}
