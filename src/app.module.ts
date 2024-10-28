import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import * as fs from 'fs-extra'; // Enhanced file system module to manage file operations
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KnexModule } from './knex/knex.module'; // Database connection module
import { RouteLogger } from '@middlewares/route.logger.middleware'; // Custom middleware to log routes
import { JwtModule, JwtSecretRequestType } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config'; // Module for managing environment variables
import { AuthModule } from './auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter'; // Event Emitter module for NestJS events
import { EventsModule } from './events/events.module';
import { AuthMiddleware, SignUpMiddleware } from '@middlewares/auth.middleware'; // Authentication-related middleware
import { WalletsModule } from './wallets/wallets.module';
import { WebhooksModule } from './webhooks/webhooks.module';

// Adding toJSON method to BigInt for JSON serialization
declare global {
  interface BigInt {
    toJSON(): string;
  }
}
BigInt.prototype.toJSON = function () {
  return this.toString();
};

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    KnexModule, // Import KnexModule for database access
    JwtModule.register({
      global: true, // Global registration for the JwtModule
      // Secret or Key Provider for signing and verifying JWTs
      secretOrKeyProvider(requestType) {
        switch (requestType) {
          case JwtSecretRequestType.SIGN:
            // Private key for signing
            return fs.readFileSync(`./keys/jwt.private.key`);
          case JwtSecretRequestType.VERIFY:
            // Public key for verification
            return fs.readFileSync(`./keys/jwt.public.key`);
          default:
            return null;
        }
      },
      signOptions: {
        algorithm: 'RS256', // RSA256 algorithm for signing JWTs
        issuer: `${process.env.ISSUER}`, // Issuer name from environment variables
        expiresIn: `${process.env.TOKEN_EXPIRY}`, // Token expiry duration from environment variables
      },
    }),
    AuthModule, // Authentication module
    EventEmitterModule.forRoot({}), // Global event emitter configuration
    EventsModule, // Module for handling events
    WalletsModule, // Module for wallet-related services
    WebhooksModule, // Module for handling webhooks
  ],
  controllers: [AppController], // Main application controller
  providers: [AppService], // Application service provider
})
export class AppModule implements NestModule {
  // Configure middlewares for specific routes
  configure(consumer: MiddlewareConsumer): any {
    consumer
      .apply(RouteLogger) // Apply RouteLogger middleware to all routes
      .forRoutes('*')
      .apply(AuthMiddleware) // Apply AuthMiddleware only to 'auth/signin' route
      .forRoutes('auth/signin')
      .apply(SignUpMiddleware) // Apply SignUpMiddleware only to 'auth/signup' route
      .forRoutes('auth/signup');
  }
}
