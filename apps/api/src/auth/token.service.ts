import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify, SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';
import type { Env } from '../config/env.js';

export interface AccessTokenClaims {
  sub: string;
  sid: string;
}

@Injectable()
export class TokenService {
  private readonly secret: Uint8Array;
  readonly accessTtlSeconds: number;

  constructor(config: ConfigService<Env, true>) {
    this.secret = new TextEncoder().encode(config.get('JWT_ACCESS_SECRET', { infer: true }));
    this.accessTtlSeconds = config.get('JWT_ACCESS_TTL_SECONDS', { infer: true });
  }

  async signAccessToken(claims: AccessTokenClaims): Promise<string> {
    return new SignJWT({ sid: claims.sid })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(claims.sub)
      .setJti(randomUUID())
      .setIssuedAt()
      .setIssuer('roy-consultancy-api')
      .setAudience('roy-consultancy')
      .setExpirationTime(`${this.accessTtlSeconds}s`)
      .sign(this.secret);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: 'roy-consultancy-api',
        audience: 'roy-consultancy',
      });
      if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') return null;
      return { sub: payload.sub, sid: payload.sid };
    } catch {
      return null;
    }
  }
}
