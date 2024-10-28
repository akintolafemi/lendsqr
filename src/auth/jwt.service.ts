import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  generateToken(payload: { email: string; id: number }): string {
    return this.jwtService.sign(payload, {});
  }
  verifyToken(token: string): object {
    return this.jwtService.verify(token);
  }
}
