import { errors, type JWTPayload, jwtVerify, SignJWT } from 'jose';

const JWTIssuer = 'ai-chatbot';

export type TokenSignOptions = {
  secret: string;
  expiresIn: string | number;
};

export type TokenVerifyOptions = {
  secret: string;
  clockTolerance?: string | number;
};

export class JWT {
  private static encodeSecret(secret: string): Uint8Array {
    return new TextEncoder().encode(secret);
  }

  static async sign<T extends JWTPayload>(payload: T, options: TokenSignOptions): Promise<string> {
    const { secret, expiresIn } = options;
    return new SignJWT(payload)
      .setProtectedHeader({
        alg: 'HS256',
        typ: 'JWT',
      })
      .setIssuer(JWTIssuer)
      .setExpirationTime(expiresIn)
      .sign(this.encodeSecret(secret));
  }

  static async verify<T extends JWTPayload>(token: string, options: TokenVerifyOptions): Promise<T> {
    const { secret, clockTolerance = 0 } = options;

    try {
      const { payload } = await jwtVerify(token, this.encodeSecret(secret), {
        algorithms: ['HS256'],
        clockTolerance,
        issuer: JWTIssuer,
      });
      return payload as T;
    } catch (error: unknown) {
      if (error instanceof errors.JWTExpired) {
        throw new InvalidTokenError();
      }
      throw error;
    }
  }
}

export class InvalidTokenError extends Error {
  constructor(message = 'Invalid or Expired token') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}
