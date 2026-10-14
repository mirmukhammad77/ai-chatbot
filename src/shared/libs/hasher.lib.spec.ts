import { Hasher } from './hasher.lib.js';

describe('Hasher', () => {
  it('hashes and verifies a password without accepting a different password', async () => {
    const hash = await Hasher.hash('password123');
    expect(hash).not.toBe('password123');
    await expect(Hasher.verify(hash, 'password123')).resolves.toBe(true);
    await expect(Hasher.verify(hash, 'wrong-password')).resolves.toBe(false);
  });
});
