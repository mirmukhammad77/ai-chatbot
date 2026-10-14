import { validateEnvConfig } from './env.config.js';

const database = {
  DATABASE_HOST: 'localhost',
  DATABASE_NAME: 'chatbot',
  DATABASE_USERNAME: 'postgres',
  DATABASE_PASSWORD: 'password',
};

describe('Environment configuration', () => {
  it('converts port strings to numbers and supplies defaults', () => {
    expect(validateEnvConfig({ ...database, PORT: '3081', DATABASE_PORT: '5433' })).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3081,
      DATABASE_PORT: 5433,
    });
    expect(validateEnvConfig(database)).toMatchObject({ PORT: 3080, DATABASE_PORT: 5432 });
  });

  it.each(['0', '65536', 'invalid', '1.5'])('rejects an invalid port: %s', (PORT) => {
    expect(() => validateEnvConfig({ ...database, PORT })).toThrow('Invalid environment configuration');
  });

  it('reports missing database settings without exposing values', () => {
    expect(() => validateEnvConfig({ DATABASE_PASSWORD: 'secret-password' })).toThrow('DATABASE_HOST');
    expect(() => validateEnvConfig({ DATABASE_PASSWORD: 'secret-password' })).not.toThrow('secret-password');
  });
});
