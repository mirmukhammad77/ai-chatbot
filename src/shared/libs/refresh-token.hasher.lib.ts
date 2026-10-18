import { createHash } from 'node:crypto';

export class RefreshTokenHasher {
  static hash(token: string): Promise<string> {
    return Promise.resolve(createHash('sha256').update(token).digest('hex'));
  }
}
