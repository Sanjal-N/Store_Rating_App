# Store Rating Application

A full-stack web app where Normal Users rate stores (1-5), Store Owners
track ratings on their own store, and Admins manage users and stores.
Built as a technical assessment project.

## Project Overview

Three roles share a single login:

- **System Administrator** - manages users and stores, views platform-wide stats.
- **Normal User** - registers themselves, browses/searches stores, submits or
  modifies a rating for any store.
- **Store Owner** - views their store's average rating and who rated it.

The backend enforces role-based access control independently of the
frontend - hiding a button is not treated as security.

## Features

- Single login for all three roles, redirecting to the right dashboard
- Self-registration (always creates a Normal User - cannot be bypassed)
- Admin: dashboard stats, add users (any role), add stores, filterable/sortable
  user and store listings, user detail view (with store info for owners)
- Normal User: searchable store list, submit/modify a 1-5 rating, one rating
  per user per store enforced at the database level
- Store Owner: average rating + list of users who rated their store
- Password change for every role, with current-password verification
- JWT authentication, bcrypt password hashing, parameterized SQL everywhere

## Tech Stack

- **Frontend:** React 18, React Router 6, Vite, plain CSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (raw SQL via the `pg` driver - no ORM)
- **Auth:** JWT (`jsonwebtoken`), password hashing with `bcryptjs`

## Project Structure

```text
store-rating-app/
├── server/               Express API
│   ├── migrations/       Raw SQL schema
│   ├── scripts/migrate.js
│   ├── seed/seed.js       Dev sample data
│   └── src/
│       ├── config/db.js       Postgres connection pool
│       ├── middleware/        authenticate, requireRole, errorHandler
│       ├── controllers/       auth, admin, store, rating
│       ├── routes/
│       ├── utils/validation.js
│       └── app.js
├── client/               React app (Vite)
│   └── src/
│       ├── components/   Navbar, ProtectedRoute, SortableTh, StarRating
│       ├── context/AuthContext.jsx
│       ├── pages/         Login, Register, ChangePassword, StoreList,
│       │   ├── admin/     StoreOwnerDashboard, and the Admin pages
│       ├── services/api.js
│       └── styles/
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Installation

```bash
git clone <repository-url>
cd store-rating-app
```

Install each side separately:

```bash
cd server
npm install

cd ../client
npm install
```

## Database Setup

1. Create the database (adjust user/password to your local Postgres setup):

   ```bash
   psql -U postgres -c "CREATE DATABASE store_rating_db;"
   ```

2. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` to
   point at that database.

3. Run the migration (creates `users`, `stores`, `ratings` with all
   constraints):

   ```bash
   cd server
   npm run migrate
   ```

4. Seed development data (one admin, two normal users, one store owner,
   one store, a few ratings):

   ```bash
   npm run seed
   ```

## Environment Variables

**server/.env** (copy from `server/.env.example`):

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/store_rating_db
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

**client/.env** (copy from `client/.env.example`):

```env
VITE_API_URL=http://localhost:5000/api
```

## Running the Application

Two terminals:

```bash
# Terminal 1
cd server
npm run dev
```

```bash
# Terminal 2
cd client
npm run dev
```

- Backend: http://localhost:5000 (health check at `/api/health`)
- Frontend: http://localhost:5173

## Test Credentials

**DEVELOPMENT/TEST CREDENTIALS ONLY** - created by `npm run seed`, not real
accounts. Shared password for all seeded accounts: `DevPass123!`

| Role         | Email                    |
|--------------|--------------------------|
| Admin        | admin@storerating.dev    |
| Normal User  | user@storerating.dev     |
| Normal User  | user2@storerating.dev    |
| Store Owner  | owner@storerating.dev    |

## API Overview

| Method | Endpoint                          | Access             |
|--------|------------------------------------|---------------------|
| POST   | /api/auth/register                 | Public              |
| POST   | /api/auth/login                    | Public              |
| GET    | /api/auth/me                       | Authenticated       |
| POST   | /api/auth/change-password          | Authenticated       |
| GET    | /api/admin/dashboard               | Admin               |
| GET    | /api/admin/users                   | Admin               |
| POST   | /api/admin/users                   | Admin               |
| GET    | /api/admin/users/:id                | Admin               |
| POST   | /api/admin/stores                  | Admin               |
| GET    | /api/admin/store-owners            | Admin               |
| GET    | /api/stores                        | Authenticated       |
| GET    | /api/stores/:id                    | Authenticated       |
| POST   | /api/stores/:storeId/ratings       | Normal User         |
| PUT    | /api/stores/:storeId/ratings       | Normal User         |
| GET    | /api/stores/:storeId/ratings       | Admin               |
| GET    | /api/store-owner/dashboard         | Store Owner         |

## Validation Rules

- **Name:** 20-60 characters (trimmed before checking)
- **Address:** required, max 400 characters
- **Password:** 8-16 characters, at least one uppercase letter and one
  special character
- **Email:** standard format, unique (case-insensitive)
- **Rating:** integer 1-5

Every rule above is enforced on both the frontend (for UX) and the backend
(for security - the frontend checks can always be bypassed).

## Assumptions

- Store Owner accounts are created through the same Admin "Add User" form
  as Normal Users and Admins (the spec mentions this design explicitly).
- A store's average rating is always computed live via `AVG()` rather than
  stored/cached, since the dataset size in this assessment doesn't warrant it.
- A newly created Store Owner has no store until an Admin explicitly
  creates one and assigns them as owner; the Store Owner dashboard handles
  that "no store yet" state gracefully.
- One store per owner is assumed (not enforced by a unique constraint,
  since the spec doesn't require it, but the seed and UI both follow it).
