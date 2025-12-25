# CipherSQL Studio

CipherSQL Studio is a premium SQL sandbox platform allowing students to practice SQL queries in a completely secure environment with intelligent LLM hints.

##  Architecture & Security

### 1. Schema-per-Assignment
We use a **Pattern A (Schema-per-assignment)** approach for data isolation. Every assignment is contained within its own PostgreSQL schema (e.g., `a_001`). This ensures clean data isolation, prevents students from discovering answers to other assignments, and allows us to easily enforce security privileges scoped to a specific problem context. 

### 2. Defense-in-Depth Query Security
When executing user-provided SQL, we assume malicious intent. Our execution layer employs several guardrails:
- **AST Validation**: We use `node-sql-parser` to parse the query into an AST and enforce that exactly **one** statement is provided and it must be a `SELECT` (or `WITH ... SELECT`) statement. All DDL/DML statements are rejected at the application level before even touching the DB.
- **Read-Only Transactions**: All user queries are executed using `BEGIN READ ONLY`.
- **Database Roles**: Queries are executed via a constrained `cipher_student` role which only has `USAGE` on the specific schema and `SELECT` on its tables. It lacks `CREATE`, `TEMP`, and `COPY` privileges.
- **Timeouts & Limits**: We strictly enforce `statement_timeout` and `lock_timeout` to stop runaway queries (like `pg_sleep`). We also wrap the user's query (`SELECT * FROM (...) q LIMIT 200;`) to prevent out-of-memory errors from massive joins.
- **Keyword Denylist**: We scan for dangerous functions (`dblink`, `lo_import`, `pg_write_file`) that could potentially be used for local file exfiltration or DoS.

*(See OWASP SQL Injection Prevention Guidelines for more on least-privilege DB access).*

## 🛣 Data-Flow Diagram

```
[Student Browser]
       │
       │ 1. User clicks "Run Query"
       ▼
[React Frontend] ──> Validates non-empty query string
       │
       │ 2. POST /api/assignments/:id/execute
       ▼
[Express Backend]
       │
       ├─> 3a. MongoDB: Fetches assignment metadata (e.g. schemaName "a_001")
       ├─> 3b. AST Validator: Ensures exactly 1 SELECT statement
       │
       ▼
[PostgreSQL Database]
       │
       ├─> 4a. Connects as `cipher_student`
       ├─> 4b. `BEGIN READ ONLY`
       ├─> 4c. `SET search_path TO a_001`
       ├─> 4d. `SET statement_timeout = 10000`
       ├─> 4e. Executes wrapped query
       └─> 4f. `COMMIT` or `ROLLBACK` on error
       │
       ▼
[Express Backend] ──> Maps DB error messages to friendly student errors
       │
       │ 5. Returns HTTP 200 Results OR HTTP 400 Error
       ▼
[React Frontend] ──> Renders interactive Data Table / Error UI
```

##  API Documentation

### Endpoints
- `GET /api/health` - Check API status
- `POST /api/seed` - Seeds MongoDB with sample assignments
- `GET /api/assignments` - List all assignments
- `GET /api/assignments/:id` - Fetch a single assignment
- `GET /api/assignments/:id/schema` - Introspects DB and returns tables, columns, and 5 sample rows for the assignment.
- `POST /api/assignments/:id/execute` - Body `{ sql: string }`. Returns columns and rows.
- `POST /api/assignments/:id/hint` - Body `{ sql: string, lastError?: string }`. Returns LLM hint.

##  Known Limitations
- Only `SELECT` statements are supported. Writes are universally blocked.
- CTEs (`WITH` clauses) are supported, but must end in a `SELECT`.
- Results are strictly paginated/limited to 200 rows max to avoid browser lockups.
- No cross-schema `JOIN`s are permitted (blocked by `search_path` and roles).

## Setup & Execution

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 18+

### 2. Start Services
```bash
# Start Postgres and Mongo via Docker
docker-compose up -d

# Install dependencies in the root
npm install

# Start both Backend and Frontend concurrently
npm run dev

# Run End-to-End Tests
npm run test:e2e
```

### 3. Expectations
By default, the `docker-compose.yml` initializes PostgreSQL with an `a_001` schema, creates a `departments` and `employees` table, and inserts seed data. It also creates the `cipher_student` role and configures `student_user` with the strict least-privilege setup.
