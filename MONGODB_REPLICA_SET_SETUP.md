# MongoDB Replica Set Setup Guide

## Problem
Prisma requires MongoDB to run as a replica set to support transactions.

## Solutions

### ✅ Solution 1: MongoDB Atlas (EASIEST - Recommended for Quick Fix)

1. **Sign up**: Go to https://www.mongodb.com/cloud/atlas/register
2. **Create Free Cluster**: Choose M0 (free tier)
3. **Create Database User**: 
   - Go to Database Access
   - Add new user with username/password
4. **Whitelist IP**: 
   - Go to Network Access
   - Add IP: `0.0.0.0/0` (for development only)
5. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

6. **Create `.env` file** in the backend folder:
```
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/hotel_management?retryWrites=true&w=majority"
```
Replace `username`, `password`, and `cluster` with your actual values.

---

### Solution 2: Local MongoDB with Replica Set (Requires Admin Access)

#### For Windows:

1. **Stop MongoDB Service** (Run PowerShell as Administrator):
```powershell
Stop-Service MongoDB
```

2. **Find MongoDB config file** (usually at):
   - `C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg`

3. **Edit the config file** and add:
```yaml
replication:
  replSetName: "rs0"
```

4. **Restart MongoDB Service**:
```powershell
Start-Service MongoDB
```

5. **Initialize Replica Set** (in MongoDB Shell):
```javascript
mongosh
rs.initiate()
```

6. **Update your `.env` file**:
```
DATABASE_URL="mongodb://localhost:27017/hotel_management?replicaSet=rs0"
```

---

### Solution 3: Docker with MongoDB Replica Set (Alternative)

1. **Create `docker-compose.yml`**:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:8.2
    container_name: mongodb
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    command: mongod --replSet rs0
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

2. **Start Docker**:
```bash
docker-compose up -d
```

3. **Initialize Replica Set**:
```bash
docker exec -it mongodb mongosh --eval "rs.initiate()"
```

4. **Update `.env`**:
```
DATABASE_URL="mongodb://admin:password@localhost:27017/hotel_management?replicaSet=rs0&authSource=admin"
```

---

## Quick Test After Setup

1. Make sure you have a `.env` file with `DATABASE_URL`
2. Run: `npx prisma db push`
3. Test your API endpoint with Postman

---

## Next Steps After Fixing Connection

If you choose MongoDB Atlas or configure replica set, remember to:
1. Create your `.env` file with the correct `DATABASE_URL`
2. Run `npx prisma generate` 
3. Test your register endpoint again

