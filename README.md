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

### 1. Configure environment

```bash
cp .env.example .env
```

### 2. Start API

```bash
corepack enable
pnpm install
pnpm dev
```

Environment variables are validated at startup.\
Application fails fast if configuration is invalid.
