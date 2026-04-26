# Deployment Guide

## 1) Database: Supabase

1. Create a Supabase project.
2. Apply migrations:
   - `npx supabase db push --db-url "<SUPABASE_DATABASE_URL>"`
3. Seed data:
   - `psql "<SUPABASE_DATABASE_URL>" -f supabase/seed.sql`

Required backend variables from Supabase:
- `SUPABASE_DATABASE_URL`
- `SUPABASE_JDBC_URL`
- `SUPABASE_DB_USERNAME`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_JWT_ISSUER_URI`
- `SUPABASE_JWT_AUDIENCE`
- `SUPABASE_JWT_SECRET_BASE64`

## 2) Backend: Railway

Service source: repository root with `railway.json` and `backend/Dockerfile`.

Set Railway variables:
- `SPRING_PROFILES_ACTIVE=prod`
- `APP_SECURITY_CORS_ALLOWED_ORIGINS=https://costwiseai-frontend.pages.dev`
- `SUPABASE_DATABASE_URL`
- `SUPABASE_JDBC_URL`
- `SUPABASE_DB_USERNAME`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_JWT_ISSUER_URI`
- `SUPABASE_JWT_AUDIENCE`
- `SUPABASE_JWT_SECRET_BASE64`

Deploy:
- `npx railway up`

## 3) Frontend: Cloudflare Pages

In Cloudflare Pages, use:
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Set frontend variable:
- `VITE_API_BASE_URL=https://<RAILWAY_BACKEND_DOMAIN>`

Deploy from CLI (optional):
- `cd frontend`
- `npm run deploy:cloudflare`

