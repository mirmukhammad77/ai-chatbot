import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { type App } from 'supertest/types.js';
import { vi } from 'vitest';
import { DatabaseService } from '../src/modules/database/database.service.js';
import { type User } from '../src/modules/users/entities/index.js';
import { type CreateUserParams, UsersRepository } from '../src/modules/users/repositories/users.repository.js';
import { Hasher } from '../src/shared/libs/hasher.lib.js';

const user: User = {
  id: '64b7a3a7-1666-4003-875e-777777777777',
  email: 'test@example.com',
  password: 'stored-hash',
  firstName: null,
  lastName: null,
  role: 'USER',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: null,
  deletedAt: null,
};

describe('Signup (e2e with mocked database)', () => {
  let app: INestApplication<App>;
  const repository = {
    getByEmail: vi.fn<(email: string) => Promise<User | null>>(),
    create: vi.fn<(params: CreateUserParams) => Promise<User>>(),
  };

  beforeAll(async () => {
    // These tests must run without a local .env file or a PostgreSQL server.
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATABASE_HOST', 'localhost');
    vi.stubEnv('DATABASE_PORT', '5432');
    vi.stubEnv('DATABASE_NAME', 'chatbot_test');
    vi.stubEnv('DATABASE_USERNAME', 'postgres');
    vi.stubEnv('DATABASE_PASSWORD', 'test');
    const { AppModule } = await import('../src/app.module.js');
    const fixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue({})
      .overrideProvider(UsersRepository)
      .useValue(repository)
      .compile();
    app = fixture.createNestApplication({ logger: false });
    await app.init();
  });

  beforeEach(() => {
    repository.getByEmail.mockReset().mockResolvedValue(null);
    repository.create.mockReset().mockResolvedValue(user);
  });

  afterAll(async () => {
    await app?.close();
    vi.unstubAllEnvs();
  });

  it('registers signup, hashes the password, and omits it from the response', async () => {
    const response = await request(app.getHttpServer()).post('/auth/signUp').send({ email: user.email, password: 'password123' });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: user.id, email: user.email });
    expect(response.body).not.toHaveProperty('password');
    const params = repository.create.mock.calls[0][0];
    expect(params.password).not.toBe('password123');
    await expect(Hasher.verify(params.password, 'password123')).resolves.toBe(true);
  });

  it.each([
    { email: 'invalid', password: 'password123' },
    { email: user.email, password: 'short' },
    { email: user.email, password: 'a'.repeat(129) },
    { email: user.email },
    { email: user.email, password: 12345678 },
    { email: user.email, password: 'password123', role: 'ADMIN' },
  ])('rejects invalid input: %j', async (body) => {
    const response = await request(app.getHttpServer()).post('/auth/signUp').send(body);
    expect(response.status).toBe(400);
    expect(repository.getByEmail).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('returns 409 for an existing email', async () => {
    repository.getByEmail.mockResolvedValue(user);
    const response = await request(app.getHttpServer()).post('/auth/signUp').send({ email: user.email, password: 'password123' });
    expect(response.status).toBe(409);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('returns 409 if another request inserts the same email first', async () => {
    repository.create.mockRejectedValue(new Error('Insert failed', { cause: { code: '23505' } }));
    const response = await request(app.getHttpServer()).post('/auth/signUp').send({ email: user.email, password: 'password123' });
    expect(response.status).toBe(409);
  });

  it('preserves unexpected database failures as 500 responses', async () => {
    repository.create.mockRejectedValue(new Error('Database unavailable'));
    const response = await request(app.getHttpServer()).post('/auth/signUp').send({ email: user.email, password: 'password123' });
    expect(response.status).toBe(500);
    expect(response.body).not.toHaveProperty('password');
  });
});
