import { NestApplicationOptions } from '@nestjs/common';

export const AppOptions: NestApplicationOptions = {
  rawBody: true,
  cors: {
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  },
};
