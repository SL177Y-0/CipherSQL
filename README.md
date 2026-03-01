# CipherSQL Studio

A SQL practice platform where students can solve challenges against a real PostgreSQL database. Built with React, Express, and TypeScript.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## What it does

- Browse SQL challenges sorted by difficulty (Beginner → Advanced)
- Write queries in a Monaco editor (same as VS Code)
- Run them against a live PostgreSQL database
- Get AI-powered hints when you're stuck
- See database schemas, expected output, and past attempts

Queries run inside a sandboxed environment — only `SELECT` is allowed, everything else is blocked at multiple levels.

## Quick start

```bash
git clone https://github.com/SL177Y-0/CipherSQL.git
cd "CipherSQL Studio"

# spin up postgres + mongo
docker-compose up -d

# install everything
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# run it
npm run dev
```

Frontend runs on http://localhost:5173, API on http://localhost:4000/api

The app auto-seeds sample assignments on first load if the database is empty.

## Tech stack

**Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Monaco Editor

**Backend:** Express.js, TypeScript, node-sql-parser (SQL validation), pg, Mongoose

**Databases:** PostgreSQL 15 (query sandbox), MongoDB 6 (assignments & attempts)

**Testing:** Playwright (37 e2e tests)

## Project layout

```
├── backend/
│   └── src/
│       ├── index.ts          # express server setup
│       ├── routes/api.ts     # all 8 API endpoints
│       ├── db/               # pg + mongo connections
│       ├── middleware/        # SQL validator + error mapper
│       ├── models/           # mongoose schemas
│       └── services/llm.ts   # hint generation + rate limiter
├── frontend/
│   └── src/
│       ├── App.tsx           # routes
│       ├── pages/            # HomePage + AssignmentPage
│       ├── lib/api.ts        # typed API client
│       └── index.css         # design system (CSS vars)
├── DataBase/
│   └── 01-init.sql           # schema + seed data + roles
├── tests/                    # playwright e2e tests
├── docs/                     # architecture + deployment docs
└── docker-compose.yml
```

## API endpoints

| Method | Path | What it does |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/seed` | Load sample assignments |
| GET | `/api/assignments` | List all assignments |
| GET | `/api/assignments/:id` | Get one assignment |
| GET | `/api/assignments/:id/schema` | Get table structure + sample data |
| POST | `/api/assignments/:id/execute` | Run a SQL query |
| POST | `/api/assignments/:id/hint` | Get an AI hint (rate limited) |
| GET | `/api/assignments/:id/attempts` | Recent query attempts |

## How the sandbox works

Every query goes through 5 checks before it touches the database:

1. **Parse** — SQL gets parsed into an AST, must be a single `SELECT`
2. **Denylist** — 23 blocked keywords (pg_sleep, dblink, copy, etc.)
3. **Function check** — 8 blocked functions (pg_read_file, lo_import, etc.)
4. **Transaction** — runs inside `BEGIN READ ONLY` with a 10s timeout
5. **Role** — executes as `student_user` who only has `SELECT` on assignment schemas

Results are capped at 200 rows.

## Environment variables

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
PG_URL=postgresql://admin:password@localhost:5432/ciphersqlstudio_app
PG_STUDENT_URL=postgresql://student_user:student_password@localhost:5432/ciphersqlstudio_app
MONGO_URL=mongodb://admin:password@localhost:27017/ciphersqlstudio_mongo?authSource=admin
LLM_API_KEY=your_key_here
LLM_PROVIDER=gemini
```

The defaults work fine for local development with docker-compose.

## Running tests

```bash
cd tests && npx playwright install
npm run test:e2e
```

## Known limitations

- Only SELECT queries (by design)
- Results capped at 200 rows
- Rate limiting is in-memory (resets on restart)
- No user auth — everyone is "anonymous"
- AI hints use mock responses without an API key

## License

MIT
