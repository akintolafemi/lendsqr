import {
  BadRequestException,
  Logger,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { NestApplication, NestFactory } from '@nestjs/core';
import { AppOptions } from '@utils/app.options.util';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    AppOptions,
  );

  app.setGlobalPrefix('/api/v1');

  app.set('trust proxy', true);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException({
          statusText: 'bad request',
          status: 400,
          message:
            errors[0]?.children[0]?.children[0]?.constraints[
              Object?.keys(errors[0]?.children[0]?.children[0]?.constraints)[0]
            ] ||
            errors[0]?.children[0]?.constraints[
              Object?.keys(errors[0]?.children[0]?.constraints)[0]
            ] ||
            errors[0]?.constraints[Object?.keys(errors[0]?.constraints)[0]] ||
            'Unable to validate request',
        });
      },
    }),
  );

  app.enableShutdownHooks();

  const logger = new Logger(NestApplication.name);
  const port = process.env.PORT || 3005;
  await app.listen(port, () => {
    logger.log(`Server is now listening on port ${port}`);
  });
}
bootstrap();
