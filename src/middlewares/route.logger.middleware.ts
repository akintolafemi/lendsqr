import { Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export class RouteLogger implements NestMiddleware {
  logger: Logger = new Logger('ROUTE LOGGER');

  use(request: Request, response: Response, nextFunction: NextFunction) {
    const { ip, method, originalUrl } = request;
    const userAgent = request.headers['user-agent'];

    const now = Date.now();
    response.on('finish', () => {
      const { statusCode, statusMessage } = response;
      const contentLength = response.get('content-length');
      this.logger.log(
        `${userAgent} ${ip} ${method} ${originalUrl} - ${statusCode} | ${statusMessage} content-length = ${contentLength} | time taken - ${
          Date.now() - now
        }ms`,
      );
    });
    nextFunction();
  }
}
