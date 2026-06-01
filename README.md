# Exquisite Tents & Hiring — Vite + React + Supabase

Quick scaffold for orders and quotes.

Setup

1. Copy `.env.example` to `.env` and set your Supabase values:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

2. Install dependencies and run dev server:

```bash
npm install
npm run dev
```

Notes

- The app expects a Supabase table named `orders` where it inserts orders. Columns used: all JSON fields inserted from the order form (including `quote` and `created_at`).
- Environment variables required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
