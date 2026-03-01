# Deploy CipherSQL Studio to t3.small EC2

## Pre-Deployment Checklist

### Environment Variables Needed

Create `.env` file on t3.small:

```bash
# Server
PORT=4000
CORS_ORIGIN=http://<YOUR_SERVER_IP>:4000  # Replace with your t3.small IP

# PostgreSQL
PG_URL=postgresql://admin:<YOUR_PG_PASSWORD>@localhost:5432/ciphersqlstudio_app
PG_STUDENT_URL=postgresql://student_user:<YOUR_STUDENT_PASSWORD>@localhost:5432/ciphersqlstudio_app

# MongoDB
MONGO_URL=mongodb://admin:<YOUR_MONGO_PASSWORD>@localhost:27017/ciphersqlstudio_mongo?authSource=admin

# LLM (Gemini)
LLM_API_KEY=<YOUR_LLM_API_KEY>
LLM_PROVIDER=gemini
```

### Resource Requirements for t3.small (2GB RAM)

| Service | RAM Usage | Optimization |
|---------|-----------|--------------|
| OpenClaw | ~500MB | Already running |
| PostgreSQL | ~200MB | Reduce shared_buffers |
| MongoDB | ~150MB | Use wiredTiger cache 128MB |
| Node.js Backend | ~150MB | Limit workers |
| Node.js Frontend | ~100MB | Production build |
| Nginx | ~20MB | Default |
| **Total** | ~1.1GB | **Safe limit** |

## Deployment Steps

### 1. SSH to t3.small
```bash
ssh -i ~/.ssh/<YOUR_SSH_KEY>.pem ubuntu@<YOUR_SERVER_IP>
```

### 2. Install Dependencies (if not present)
```bash
# Docker should already be installed
sudo apt-get update
sudo apt-get install -y nodejs npm

# Install PM2 for process management
sudo npm install -g pm2
```

### 3. Optimize PostgreSQL for Low RAM
Create `postgres-lowram.conf`:
```conf
shared_buffers = 128MB
effective_cache_size = 512MB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 20
```

### 4. Optimize MongoDB
```bash
# Start MongoDB with small cache
mongod --wiredTigerCacheSizeGB 0.25
```

### 5. Deploy Application
```bash
# Clone or copy files
cd /opt
git clone https://github.com/SL177Y-0/CipherSQL.git
cd CipherSQL

# Install deps (without dev)
npm install --production
cd backend && npm install --production && cd ..
cd frontend && npm install && npm run build && cd ..

# Copy env
cp .env.example .env
# Edit .env with production values

# Start services
sudo docker-compose up -d postgres mongo
pm2 start backend/dist/index.js --name ciphersql-backend
pm2 serve frontend/dist 5173 --name ciphersql-frontend
```

### 6. Security Group Rules
Open ports:
- 4000 (API) - Your IP only
- 5173 (Frontend) - Your IP only
- 5432 (PostgreSQL) - localhost only
- 27017 (MongoDB) - localhost only

### 7. OpenClaw Coexistence
```bash
# Check OpenClaw status
openclaw status

# Ensure ports don't conflict
# CipherSQL uses: 4000 (API), 5173 (Frontend)
# OpenClaw uses: 8080 (Gateway) - No conflict
```

## RAM Optimization Tips

1. **Use production builds**: `npm run build` for frontend
2. **Limit PostgreSQL**: shared_buffers = 128MB
3. **Limit MongoDB**: wiredTigerCacheSizeGB = 0.25
4. **No AList**: Keep disabled to save RAM
5. **PM2 cluster mode**: Use max 1 instance on t3.small

## Monitoring

```bash
# Check memory usage
free -h

# Check services
pm2 status
sudo docker-compose ps

# Check logs
pm2 logs
curl http://localhost:4000/api/health
```
