import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import MainGuard from 'src/guards/main.guards';
import { CreateAccountDto } from '@dtos/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @UseGuards(MainGuard)
  @Post(`/signin`)
  public async signJWT() {
    return this.service.signJWT();
  }

  @UseGuards(MainGuard)
  @Post(`/signup`)
  public async CreateUser(@Body() req: CreateAccountDto) {
    return this.service.createAccount(req);
  }
}
