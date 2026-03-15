# Apartment Management - PostgreSQL Setup

This project now uses PostgreSQL for auth, listings, sign-up, and dashboard data.

## Prerequisites

- Node.js 20+
- PostgreSQL running locally
- A database created (example: apManagement)

## Environment Variables

Use your existing .env.local and confirm values for your machine.

Required values:

- NEXTAUTH_SECRET
- NEXTAUTH_DEMO_PASSWORD
- PGHOST
- PGPORT
- PGUSER
- PGPASSWORD
- PGDATABASE

## Install Dependencies

```bash
npm install
```

## Initialize Database

Run schema then seed:

```bash
psql -h 127.0.0.1 -p 5432 -U postgres -d apManagement -f db/schema.sql
psql -h 127.0.0.1 -p 5432 -U postgres -d apManagement -f db/seed.sql
```

If your connection values differ, update the command flags accordingly.

## Run App

```bash
npm run dev
```

App URL: http://localhost:3000

## API Endpoints (PostgreSQL-backed)

- GET /api/v1/listings
- POST /api/v1/signIn
- POST /api/v1/signup
- GET /api/v1/dashboard
- NextAuth credentials provider: /api/auth/[...nextauth]

## Demo Login

- Use any active user email from seeded users
- Use NEXTAUTH_DEMO_PASSWORD as the password

Seeded active users include:

- john.doe@example.com
- jane.smith@example.com
- lvredeveld9@gmail.com

## Notes

- Sign-up now persists to PostgreSQL.
- Sign-in still uses temporary demo-password behavior for all users.
- Password hashing is intentionally deferred for a hardening pass.
