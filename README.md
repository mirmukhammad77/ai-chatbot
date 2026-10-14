# AI Chatbot

A full-stack AI chatbot application built as a learning and portfolio project.

The goal of this project is to build a chatbot that can understand text messages, work with uploaded files, maintain conversations, and provide AI-powered responses.

## Project Status

### In development

The project is being built incrementally, starting with the backend and gradually adding the frontend, AI integration, database, file processing, authentication, and other features.

## Planned Features

- AI-powered chat
- File uploads
- Document processing
- AI responses based on uploaded documents
- Conversation history
- User authentication
- Protected user data
- RAG (Retrieval-Augmented Generation)
- Streaming AI responses
- Persistent database storage
- Docker support
- CI/CD with GitHub Actions

## Stack

- NestJS
- Zod (env validation)
- Postgres 17.8 (Docker)
- ESLint + Prettier (code quality & formatting)
- Husky (Git hooks)

## Local Setup

The setup was verified with Node.js 25.2.1 and pnpm 12.8.1.

Run these commands from ai-chatbot-service.

### 1. Install dependencies

```bash
pnpm install --frozen-lockfile
```

Native build scripts for Argon2 and esbuild are enabled in pnpm-workspace.yaml.

### 2. Configure environment

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

Set the PostgreSQL credentials in .env. Environment variables and port ranges are validated at startup.
Keep .env private; it is ignored by Git.

### 3. Prepare PostgreSQL

Start PostgreSQL and create the database named by DATABASE_NAME, then apply the migrations:

```bash
pnpm db:migrate
```

Docker Desktop must be running if your database runs in Docker. A separately running PostgreSQL server also works.
Review migrations against existing data before applying them. The second migration adds a required message sequence
without a backfill, so it assumes the messages table is empty. For an existing populated database, plan a data backfill first.

### 4. Start the API

```bash
pnpm dev
```

The default address is http://localhost:3080.
The implemented endpoint is POST /auth/signUp with an email and a password of 8–128 characters.
Successful signup returns HTTP 201 with public user fields. Invalid input returns 400; duplicate email returns 409.
Passwords are hashed with Argon2 and excluded from responses. GET / has no registered route.

For production startup:

```bash
pnpm build
pnpm start:prod
```

### Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

The unit tests cover environment validation, password hashing, and the active-user query.
The HTTP tests cover signup, validation, password exclusion, duplicate emails, and database failures.
HTTP tests replace the database and repository; they run without PostgreSQL or a local .env.

### ES module imports

This package uses native Node.js ES modules. Local imports use explicit .js filenames, including index.js for barrels.
TypeScript resolves those filenames to the corresponding .ts source files. NodeNext checks imports using Node's rules,
so development and production run the same emitted imports without alias rewriting.

See [SETUP-AUDIT.md](./SETUP-AUDIT.md) for the setup findings and verification limits.
