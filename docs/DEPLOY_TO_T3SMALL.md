# Deploy to t3.small

Quick guide for getting CipherSQL running on an EC2 t3.small (2GB RAM).

## env setup

SSH in and create a `.env`:
```bash
PORT=4000
CORS_ORIGIN=http://<YOUR_IP>:4000
PG_URL=postgresql://admin:<PG_PASSWORD>@localhost:5432/ciphersqlstudio_app
PG_STUDENT_URL=postgresql://student_user:<STUDENT_PASSWORD>@localhost:5432/ciphersqlstudio_app
MONGO_URL=mongodb://admin:<MONGO_PASSWORD>@localhost:27017/ciphersqlstudio_mongo?authSource=admin
LLM_API_KEY=<YOUR_KEY>
LLM_PROVIDER=gemini
```

## RAM budget (~1.1GB used out of 2GB)

- PostgreSQL: ~200MB (shared_buffers=128MB)
- MongoDB: ~150MB (wiredTiger cache 0.25GB)
- Node backend: ~150MB
- Node frontend (built): ~100MB
- Nginx: ~20MB
- OpenClaw (if running): ~500MB

## deploy steps

```bash
ssh -i ~/.ssh/<KEY>.pem ubuntu@<IP>

# install deps (docker should already be there)
sudo apt-get update && sudo apt-get install -y nodejs npm
sudo npm install -g pm2

# clone + install
cd /opt
git clone https://github.com/SL177Y-0/CipherSQL.git
cd CipherSQL
npm install --production
cd backend && npm install --production && cd ..
cd frontend && npm install && npm run build && cd ..

cp .env.example .env
# edit .env with real values

# start dbs
sudo docker-compose up -d postgres mongo

# start app
pm2 start backend/dist/index.js --name ciphersql-api
pm2 serve frontend/dist 5173 --name ciphersql-ui
```

## postgres tuning for low RAM

Create `postgres-lowram.conf`:
```
shared_buffers = 128MB
effective_cache_size = 512MB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 20
```

## ports / security groups

- 4000 (API) — your IP only
- 5173 (Frontend) — your IP only
- 5432 (Postgres) — localhost only
- 27017 (Mongo) — localhost only

## monitoring

```bash
free -h
pm2 status
pm2 logs
curl http://localhost:4000/api/health
```
