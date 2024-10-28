import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { createHmac } from 'crypto';

@Injectable()
export default class PayStackGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      // Get the signature sent by Paystack
      const hash = createHmac('sha512', `${process.env.PAYSTACK_SECRETE_KEY}`)
        .update(JSON.stringify(request.body))
        .digest('hex');
      const signature = request.headers['x-paystack-signature'];
      if (signature !== hash)
        throw new HttpException('Invalid signature', HttpStatus.FORBIDDEN, {
          cause: ``,
          description: ``,
        });
    } catch (error) {
      throw new HttpException(
        {
          message: 'Unable to verify event',
          statusText: 'error',
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          data: error,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return true;
  }
}
