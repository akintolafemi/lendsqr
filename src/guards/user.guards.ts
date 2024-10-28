import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from 'src/auth/jwt.service';
import { KnexService } from 'src/knex/knex.service';
import { StatusText } from 'src/types/response.types';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dbService: KnexService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      //check if auth header exists
      if (!request.headers.authorization) {
        throw new HttpException(
          {
            message: 'Authorization token not found',
            statusText: StatusText.ERROR,
            status: HttpStatus.UNAUTHORIZED,
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      //get token from reques, verifiedToken
      const token = request.headers.authorization.split(' ')[1];
      if (!token) {
        throw new HttpException(
          {
            message: 'Invalid authorization token',
            statusText: StatusText.ERROR,
            status: HttpStatus.UNAUTHORIZED,
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      //decode token
      const verifiedToken = this.jwtService.verifyToken(token);

      //get user
      const user = await this.dbService
        .client('users')
        .where({
          id: verifiedToken['id'],
        })
        .select('*')
        .first();

      if (!user) {
        throw new HttpException(
          {
            message: 'Failed to verify user or user no longer exist',
            statusText: StatusText.UNAUTHORIZED,
            status: HttpStatus.UNAUTHORIZED,
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
      //attach user to request
      request['user'] = user;

      return true;
    } catch (error) {
      throw new HttpException(
        {
          message: error,
          statusText: StatusText.ERROR,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
