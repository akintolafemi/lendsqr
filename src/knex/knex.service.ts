import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { knex, Knex } from 'knex';

@Injectable()
export class KnexService
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  private readonly logger = new Logger(KnexService.name);
  private knexClient: Knex;

  constructor() {
    this.knexClient = knex({
      client: 'mysql2',
      connection: {
        host: `${process.env.DB_HOST}`,
        user: `${process.env.DB_USER}`,
        password: `${process.env.DB_PASS}`,
        database: `${process.env.DB_NAME}`,
      },
      debug: process.env.NODE_ENV === 'development',
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('Connected to MySQL service database');
    } catch (error) {
      this.logger.error('Failed to connect to MySQL service database', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.knexClient.destroy();
    this.logger.log('Disconnected from MySQL service database');
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Application shutdown gracefully with signal: ${signal}`);
    await this.knexClient.destroy();
  }

  // Proxy the Knex client so we can call it directly as a function
  apply(target: KnexService, thisArg: any, argArray: [string]) {
    return this.knexClient.apply(this.knexClient, argArray);
  }

  // Allow method calls to directly use Knex syntax
  [method: string]: any;

  // Enable access to Knex query methods
  public get client(): Knex {
    return this.knexClient;
  }
}
