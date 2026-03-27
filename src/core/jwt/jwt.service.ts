import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  async tokenGenerator(
    payload: Record<string, any>,
    expiresIn: JwtSignOptions['expiresIn'] = '1d',
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn,
    });
  }

  async tokenVerifier(token: string): Promise<Record<string, any>> {
    try {
      return this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
