import { hash as ahash, verify as averify } from 'argon2';

export class Hasher {
  static async hash(plain: string): Promise<string> {
    return await ahash(plain);
  }

  static async verify(hashed: string, plain: string): Promise<boolean> {
    return await averify(hashed, plain);
  }
}
