import type { JWTPayload } from 'jose';

export type AccessTokenPayload = JWTPayload & {
  sub: string;
};

export type RefreshTokenPayload = JWTPayload & {
  sub: string;
  jti: string;
};
