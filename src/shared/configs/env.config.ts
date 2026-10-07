import { z } from 'zod';

export const envConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3080),

  DATABASE_HOST: z.string().nonempty(),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DATABASE_NAME: z.string().nonempty(),
  DATABASE_USERNAME: z.string().nonempty(),
  DATABASE_PASSWORD: z.string().nonempty(),
});

export type EnvConfig = z.infer<typeof envConfigSchema>;

export function validateEnvConfig(config: unknown): EnvConfig {
  const parsed = envConfigSchema.safeParse(config);
  if (!parsed.success) {
    const errorMessage = parsed.error.issues.map((issue) => {
      return {
        field: issue.path.join('.'),
        message: issue.message,
      };
    });
    throw new Error(`Invalid environment configuration: ${JSON.stringify(errorMessage)}`);
  }
  return parsed.data;
}
