import { RefreshTokenHasher } from '../refresh-token.hasher.lib.js';

describe('RefreshTokenHasher', () => {
  it('returns a SHA-256 hex digest for a refresh token', async () => {
    await expect(RefreshTokenHasher.hash('abc')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('returns a stable hash for the same token and different hashes for different tokens', async () => {
    const firstHash = await RefreshTokenHasher.hash('refresh-token');

    await expect(RefreshTokenHasher.hash('refresh-token')).resolves.toBe(firstHash);
    await expect(RefreshTokenHasher.hash('another-refresh-token')).resolves.not.toBe(firstHash);
  });
});
