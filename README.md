# HamAI (BudgetAI) — Frontend

HamAI is a modern budgeting app with an **auto-entry feature** that can turn messy text (receipts / notes) into structured **transactions** you can review and save.

This folder contains the **React** UI.

## What you can do

- **Sign up / log in** (Firebase Authentication)
- View a monthly **Dashboard** of transactions
- See **analytics** (charts, category totals, daily trend)
- Add a transaction using:
  - **Auto-entry feature** (AI-first, with a local fallback parser)
  - A full **transaction form** for editing/saving
- Edit and delete transactions with in-app confirmation dialogs

## Tech stack

- React (Create React App)
- Firebase Auth (client)
- Axios (API client with Firebase token interceptor)
- Recharts (charts)

## Environment variables

Create React App only exposes variables prefixed with `REACT_APP_` to the browser.

This frontend reads variables from `frontend/.env`:

- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_API_URL` (or `REACT_APP_API_URL_LOCAL`)
- `REACT_APP_API_URL_PROD`

We do **not** commit `frontend/.env`. Instead, it’s auto-generated from `backend/.env` by:

```bash
node ../backend/sync-env.cjs
```

(`npm start` / `npm run build` runs this automatically via `prestart` / `prebuild`.)

## Run locally (recommended)

### Option A: run both apps together

```bash
cd backend
npm run install-all
npm run dev:all
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5001/api` (or `PORT`)

### Option B: run frontend only

```bash
cd frontend
npm install
npm start
```

## API expectations

The frontend expects the backend to provide:

- `POST /api/auth/verify`
- `GET /api/auth/me`
- `POST /api/budget/parse`
- `GET /api/budget/stats/summary?month=&year=`
- plus CRUD under `/api/budget/*`

## Deploy notes (Vercel)

- `REACT_APP_*` values are **public** (bundled into the browser).
- If you deploy the frontend to Vercel, set `REACT_APP_*` in Vercel Environment Variables.
- Vercel can host the frontend easily; hosting the backend on Vercel typically requires **serverless** APIs (Express long-running servers don’t run as-is).

