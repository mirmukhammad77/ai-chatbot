# Setup audit — 2026-10-12

## Findings corrected

- Runtime directory imports and extensionless imports caused ERR_UNSUPPORTED_DIR_IMPORT and would also cause unresolved module errors. Source imports now name .js files, with explicit index.js barrels.
- The bundler resolver allowed imports that Node could not run. Module emission and resolution now use NodeNext.
- Development skipped the build script's tsc-alias rewrite. Both modes now use native imports; the obsolete alias dependencies were removed.
- The production script now explicitly names dist/main.js. The unused deploy script was removed.
- pnpm-workspace.yaml contained placeholder strings where native-build permissions should be booleans. Argon2 and esbuild are now enabled.
- AuthController was not registered. AuthModule now exposes POST /auth/signUp.
- Request DTO validation was inactive. A global ValidationPipe and class-transformer dependency now activate validation and reject extra fields.
- Password validation used numeric Min/Max decorators on strings. It now uses MinLength/MaxLength.
- User lookup selected deleted users with IS NOT NULL. It now selects active users with IS NULL.
- Signup returned the complete database user, including the password hash. Responses now omit password.
- Duplicate email raised a generic error. It now returns HTTP 409, including PostgreSQL unique violations caused by concurrent requests.
- Database credentials were interpolated into a URL without escaping. Runtime and migration configuration now use separate connection fields.
- Database pools were not closed during application shutdown. The database service now owns and closes its pool, with Nest shutdown hooks enabled.
- The starter HTTP test expected a nonexistent Hello World route. It was replaced with signup regression tests.
- Vitest now transpiles Nest decorators with TypeScript metadata, matching the application compiler.
- ESLint's test rules now cover e2e files and explicitly configure the Jest-compatible rule version for Vitest.
- Formatting and unused imports were corrected.
- The custom pre-push hook existed inside Husky's generated, ignored directory. A tracked .husky/pre-push now runs the unit tests.
- README now documents PostgreSQL preparation, migrations, available endpoints, native imports, and verification commands.

## Verification

- TypeScript checking, ESLint, production build, unit tests, HTTP tests, and pnpm peer checks.
- Built application startup and HTTP 400 validation response using the real server.
- Read-only connectivity and UsersRepository query against the configured PostgreSQL database.
- Database inspection confirmed the required messages.sequence column, nullable updated_at columns, and current message-status enum.

## Limits and follow-up

- Signup tests mock database writes. This audit did not create users, apply migrations, or change existing database data.
- The second migration adds messages.sequence NOT NULL without backfilling old messages. It needs a data backfill before use on a populated messages table. Historical migrations were left intact.
- Docker Desktop's engine was unavailable during the audit, but the configured PostgreSQL server was independently reachable.
- Empty enum placeholder files and modules without endpoints do not prevent startup. The planned chat, AI, file, and login features still need implementation.
- These checks address the repository's current setup and implemented signup flow; they do not establish that future features or every possible deployment environment work.
