# Architecture

Overview of how CipherSQL Studio is put together.

## Stack

- **Frontend:** Vite + React 18 + Tailwind + Framer Motion + Monaco Editor
- **Backend:** Express.js 5 + TypeScript
- **Databases:** PostgreSQL 15 (query execution), MongoDB 6 (app data)
- **Validation:** node-sql-parser for AST-based SQL checks

## How it fits together

```
Browser (React SPA)
    │
    ├── GET /api/assignments      → MongoDB (list challenges)
    ├── GET /api/.../schema       → PostgreSQL via adminPool (table info)
    ├── POST /api/.../execute     → SQL Validator → PostgreSQL via studentPool
    └── POST /api/.../hint        → LLM service (rate limited, 5/min)
```

The backend has two Postgres connection pools:
- `adminPool` — full privileges, used for reading schema info
- `studentPool` — restricted `student_user` role, SELECT only

## Security layers

Queries go through these checks in order:

1. **App-level validation** — AST parse, single SELECT only, 23 blocked keywords, 8 blocked functions
2. **Transaction isolation** — `BEGIN READ ONLY`, 10s statement timeout, 5s lock timeout
3. **Database roles** — `cipher_student` role can only SELECT on specific schemas
4. **Schema isolation** — `SET search_path` restricts access to one assignment's tables
5. **Output limits** — query wrapped in `SELECT * FROM (...) LIMIT 200`

## Frontend structure

Two pages:
- `HomePage` — assignment cards with search/filter, auto-seeds on first visit
- `AssignmentPage` — three-panel layout (question | editor+results | schema+hints), tabbed on mobile

Key design decisions:
- 40+ CSS custom properties for theming (dark mode by default)
- Monaco editor for SQL (same engine as VS Code)
- Framer Motion for transitions and hover effects
- Custom API client with 30s timeout + AbortController

## Data models

**Assignment** (MongoDB): number, title, difficulty, description, schemaName, tags, requirements, expectedOutput

**Attempt** (MongoDB): assignmentId, queryText, status (success/error/timeout), executionTime, rowCount

Attempts have a compound index on `{assignmentId, createdAt}` for fast lookups.

## Error handling

PostgreSQL errors get mapped to friendlier messages in `validator.ts`:
- `42P01` → "Table not found"
- `42703` → "Column not found"  
- `42601` → "Syntax error near: ..."
- `57014` → "Query timed out"
- `25006` → "Write operations not allowed"

The frontend API client (`lib/api.ts`) wraps fetch with typed responses and a custom `APIError` class.
