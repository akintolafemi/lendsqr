import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtService } from './jwt.service';
// import { EventsService } from 'src/events/events.service';

@Module({
  providers: [AuthService, JwtService],
  controllers: [AuthController],
})
export class AuthModule {}
