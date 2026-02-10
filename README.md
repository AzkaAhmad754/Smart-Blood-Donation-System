# BloodConnect

## Smart Blood Donation & Emergency Blood Finder System for Pakistan

**Stack:** React.js · Node.js + Express · Socket.IO · PostgreSQL · Redis · JWT

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+

---

## Setup

### 1. Database
```bash
psql -U postgres -c "CREATE DATABASE bloodconnect;"
psql -U postgres -d bloodconnect -f dbschema.sql
```

### 2. Server
```bash
cd server
cp .env.example .env   # edit DATABASE_URL, REDIS_URL, JWT_SECRET
npm install
npm run dev            # runs on port 5000
```

### 3. Client
```bash
cd client
npm install
npm start              # runs on port 3000
```

---

## Test Credentials (from seed data)
| Role | Email | Password |
|------|-------|----------|
| Donor | donor@test.com | (set your own via register) |
| Hospital | hospital@test.com | (set your own via register) |
| Blood Bank | bank@test.com | (set your own via register) |

Register fresh accounts via `/register` for full functionality.

---

## Architecture

```
client/src/
  components/   Navbar, AlertCard, BloodTypeBadge, InventoryCard, StatusBadge
  pages/        Landing, Auth, DonorDashboard, HospitalDashboard, BloodBankDashboard
  context/      AuthContext, SocketContext
  hooks/        useNotifications
  utils/        api.js, socket.js

server/src/
  config/       db.js, redis.js
  controllers/  auth, requests, responses, inventory, donors
  middleware/   authMiddleware, errorHandler
  models/       user, donor, hospital, bloodBank, inventory, request, response
  routes/       auth, requests, responses, inventory, donors
  socket/       socketHandler.js
  utils/        matchingEngine.js, notificationQueue.js
```

## Key Features
- Real-time emergency alerts via Socket.IO with Redis pub/sub
- Role-based auth (Donor / Hospital / Blood Bank)
- Atomic PostgreSQL transactions prevent double-fulfillment
- Redis caching (30s TTL) on active requests
- Live inventory management with color-coded status
- Fulfillment progress tracking with auto-cancel of alerts
