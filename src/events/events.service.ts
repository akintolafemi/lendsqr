import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GenerateWalletNumber } from '@utils/number.utils';
import { KnexService } from 'src/knex/knex.service';
import { EventType } from 'src/types/event.types';

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
}
