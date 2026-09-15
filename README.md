# BharatForge Full-Stack

A working project-execution dashboard using React/Vite, Express and PostgreSQL.

## Requirements
- Node.js 18+
- PostgreSQL 14+

## 1. Database
Create the database:

```sql
CREATE DATABASE bharatforge;
```

## 2. Backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Linux/macOS: `cp .env.example .env`

If your PostgreSQL credentials differ, edit `DATABASE_URL` in `.env`.
The server creates tables and demo data automatically on first start.

## 3. Frontend

Open another terminal:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Linux/macOS: `cp .env.example .env`

Open the Vite URL shown in the terminal (normally http://localhost:5173).

## API
- GET `/api/health`
- GET `/api/dashboard`
- GET/POST `/api/projects`
- GET `/api/activities`
- GET `/api/activities/:id`
- PATCH `/api/activities/:id/progress`
- GET/POST `/api/reports`
- GET `/api/verification`
- PATCH `/api/verification/:id`

## Main functionality
- PostgreSQL-backed dashboard statistics
- Project management
- Activity search/filtering
- Activity detail and progress updates
- Field-report submission
- Verification queue with confirm/reject actions
- Confirmed reports update activity progress/status
- Responsive UI
