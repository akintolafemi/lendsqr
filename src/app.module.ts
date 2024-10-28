import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import * as fs from 'fs-extra';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KnexModule } from './knex/knex.module';
import { RouteLogger } from '@middlewares/route.logger.middleware';
import { JwtModule, JwtSecretRequestType } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

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
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    KnexModule,
    JwtModule.register({
      global: true,
      secretOrKeyProvider(requestType) {
        switch (requestType) {
          case JwtSecretRequestType.SIGN:
            return fs.readFileSync(`./keys/jwt.private.key`);
          case JwtSecretRequestType.VERIFY:
            return fs.readFileSync(`./keys/jwt.public.key`);
          default:
            return null;
        }
      },
      signOptions: {
        algorithm: 'RS256',
        issuer: `${process.env.ISSUER}`,
        expiresIn: `${process.env.TOKEN_EXPIRY}`,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(RouteLogger).forRoutes('*');
  }
}
