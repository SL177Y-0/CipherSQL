# Deployment

## What you need

- Node.js 18+
- Docker & Docker Compose
- PM2 (optional, for process management)

## Steps

1. Start the databases:
```bash
docker-compose up -d
```

2. Build the backend:
```bash
cd backend
npm ci
npm run build
```

3. Build the frontend:
```bash
cd frontend
npm ci
npm run build
```

4. Set your env vars — copy `.env.example` to `.env` and fill in production values.

5. Run it:
```bash
# with PM2
pm2 start backend/dist/index.js --name ciphersql-api
pm2 serve frontend/dist 5173 --name ciphersql-ui

# or just node
node backend/dist/index.js
```

For the t3.small deployment guide, see [DEPLOY_TO_T3SMALL.md](DEPLOY_TO_T3SMALL.md).