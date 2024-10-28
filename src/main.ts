import {
  BadRequestException,
  Logger,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { NestApplication, NestFactory } from '@nestjs/core';
import { AppOptions } from '@utils/app.options.util'; // Custom app options, such as CORS configuration, etc.
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // Create the Nest application using the Express platform and custom app options
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    AppOptions,
  );

  // Set global route prefix for all application routes (e.g., /api/v1/route)
  app.setGlobalPrefix('/api/v1');

  // Enable trusting proxy headers, useful for applications behind a load balancer or reverse proxy
  app.set('trust proxy', true);

  // Use a global validation pipe to handle request validation across the application
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically strip any properties not in the DTO
      transform: true, // Automatically transform payloads to match DTO types

      // Custom exception factory to handle validation errors and return a structured response
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException({
          statusText: 'bad request',
          status: 400,
          message:
            // Access deeply nested validation errors, providing a meaningful error message
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

  // Enable graceful shutdown hooks, ensuring proper cleanup when the application is terminated
  app.enableShutdownHooks();

  // Logger to track application startup status
  const logger = new Logger(NestApplication.name);
  const port = process.env.PORT || 3005; // Default port is 3005 if not provided in environment variables

  // Start listening on the configured port, and log success message
  await app.listen(port, () => {
    logger.log(`Server is now listening on port ${port}`);
  });
}
bootstrap();
