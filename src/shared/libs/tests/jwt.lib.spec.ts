import { errors, SignJWT } from 'jose';
import { InvalidTokenError, JWT } from '../jwt.lib.js';

describe('JWT', () => {
  const secret = 'test-secret';

  it('signs and verifies a token with the expected issuer and claims', async () => {
    const token = await JWT.sign({ sub: 'user-1', role: 'USER' }, { secret, expiresIn: '1h' });

    await expect(JWT.verify<{ sub: string; role: string; iss: string }>(token, { secret })).resolves.toMatchObject({
      sub: 'user-1',
      role: 'USER',
      iss: 'ai-chatbot',
    });
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await JWT.sign({ sub: 'user-1' }, { secret, expiresIn: '1h' });

    await expect(JWT.verify(token, { secret: 'wrong-secret' })).rejects.toBeInstanceOf(errors.JWSSignatureVerificationFailed);
  });

  it('converts expired tokens into InvalidTokenError', async () => {
    const token = await new SignJWT({ sub: 'user-1' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer('ai-chatbot')
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
      .sign(new TextEncoder().encode(secret));

    await expect(JWT.verify(token, { secret })).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects tokens issued by a different issuer without masking the verification error', async () => {
    const token = await new SignJWT({ sub: 'user-1' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer('another-service')
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(secret));

    await expect(JWT.verify(token, { secret })).rejects.toBeInstanceOf(errors.JWTClaimValidationFailed);
  });

  it('allows the configured clock tolerance for expiration checks', async () => {
    const token = await new SignJWT({ sub: 'user-1' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer('ai-chatbot')
      .setExpirationTime(Math.floor(Date.now() / 1000) - 2)
      .sign(new TextEncoder().encode(secret));

    await expect(JWT.verify<{ sub: string }>(token, { secret, clockTolerance: 5 })).resolves.toMatchObject({
      sub: 'user-1',
    });
  });
});
