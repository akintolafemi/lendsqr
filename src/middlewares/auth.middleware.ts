import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcryptjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { KnexService } from 'src/knex/knex.service';
import { StatusText } from 'src/types/response.types';
import { EventType } from 'src/types/event.types';

@Injectable()
export class SignUpMiddleware implements NestMiddleware {
  constructor(private readonly dbService: KnexService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const { username, mobile } = req.body;
    if (!username) {
      throw new HttpException(
        {
          message: 'email address is missing in request',
          statusText: StatusText.BAD_REQUEST,
          status: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    //check username does not exist
    const accountExist = await this.dbService
      .client('users')
      .select('id')
      .where('username', username)
      .orWhere('mobile', mobile)
      .first();
    console.log(accountExist);
    if (accountExist) {
      throw new HttpException(
        {
          message: 'email address or mobile already in use',
          statusText: 'error',
          status: HttpStatus.CONFLICT,
        },
        HttpStatus.CONFLICT,
      );
    }
    next();
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly dbService: KnexService,
    private eventEmitter: EventEmitter2,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    //check that request is valid
    const { username, password, deviceid } = req.body;

    if (!(username && password) && !(username && deviceid)) {
      throw new HttpException(
        {
          message: 'username or password is invalid',
          statusText: StatusText.BAD_REQUEST,
          status: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    //get user by username
    const user = await this.dbService
      .client('users')
      .select('*')
      .where({
        username,
        status: 'active',
        deleted: false,
      })
      .first();

    //throw error if no matching user is found
    if (!user) {
      throw new HttpException(
        {
          message: 'username does not exist',
          statusText: StatusText.BAD_REQUEST,
          status: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    //validate password or deviceid
    const passwordsMatch = await bcrypt.compare(password, user.password);
    //throw error if passwords do not match
    if (!passwordsMatch) {
      throw new HttpException(
        {
          message: `Invalid password`,
          statusText: StatusText.BAD_REQUEST,
          status: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    //update login date
    await this.dbService
      .client('users')
      .update({
        lastlogin: new Date(),
      })
      .where('id', user.id);

    this.eventEmitter.emit(EventType.AUDIT_LOG, {
      ip: req.ip,
      userid: user.id,
      note: 'User logged in',
      action: 'Authentication',
    });

    //attach user to request
    req['user'] = user;
    next();
  }
}
