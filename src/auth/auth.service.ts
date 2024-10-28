import { CreateAccountDto } from '@dtos/auth.dto';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  ResponseManager,
  standardResponse,
} from '@utils/response.manager.utils';
import { BCRYPT_HASH_ROUNDS } from 'src/constants/auth.constants';
import { KnexService } from 'src/knex/knex.service';
import * as bcrypt from 'bcryptjs';
import { StatusText } from 'src/types/response.types';
import { JwtService } from './jwt.service';
import { EventType } from 'src/types/event.types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import RequestWithUser from 'src/types/request.with.user.type';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: KnexService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(REQUEST) private request: RequestWithUser,
  ) {}

  async signJWT() {
    const payload = {
      username: this.request.user.username,
      id: this.request.user.id,
    };
    const token = this.jwtService.generateToken(payload);
    const user = this.request.user;

    return ResponseManager.standardResponse({
      statusText: StatusText.SUCCESS,
      message: 'Authentication successful',
      status: HttpStatus.OK,
      data: {
        token,
        user,
      },
    });
  }

  async createAccount(
    req: CreateAccountDto,
  ): Promise<standardResponse | HttpException> {
    try {
      const password = await bcrypt.hash(req.password, BCRYPT_HASH_ROUNDS); //hash the password
      const userid = await this.dbService.client('users').insert({
        ...req,
        status: 'active',
        password,
      });

      this.eventEmitter.emit(EventType.USER_CREATED, {
        //dispath the event to send email welcome and and create wallet for user
        firstname: req.firstname,
        username: req.username,
        userid: userid[0],
      });

      return ResponseManager.standardResponse({
        message: `Sign up successful!`,
        status: HttpStatus.CREATED,
        statusText: StatusText.SUCCESS,
      });
    } catch (error) {
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
