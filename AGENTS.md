# AGENTS.md

## Cursor Cloud specific instructions

### Overview
YKS Ders Paneli (StudyLab) is a single Next.js 15 / React 19 app for Turkish exam preparation. It uses Supabase (cloud) for auth/DB/storage, Groq for AI features, and YouTube Data API for video content. See `README.md` for setup details and `VERITABANI-SEMASI.md` for database schema.

### Running the dev server
```
npm run dev
```
Starts on port 3000. Auth pages (`/login`, `/register`, `/forgot-password`) render without Supabase; all other routes redirect unauthenticated users to `/login`.

### Environment variables
A `.env.local` file must exist with at least `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. See `.env.example` for all variables. Without valid Supabase credentials, the app compiles and serves auth pages but API calls will fail.

### Linting
```
npm run lint
```
The repo ships without an `.eslintrc.json`; `next lint` prompts interactively on first run. Create `.eslintrc.json` with `{"extends": "next/core-web-vitals"}` to enable non-interactive linting. Pre-existing lint errors exist in the codebase.

### Build
```
npm run build
```
TypeScript compiles successfully. The production build fails at the lint step due to pre-existing errors. Use `npm run dev` for development.

### Key gotchas
- `npm install` requires `--legacy-peer-deps` due to React 19 peer dependency conflicts.
- No automated test suite exists in this codebase (no test runner or test files).
- The scraper (`npm run scrape` / `node scraper.js`) requires Puppeteer which is not in `package.json` dependencies — install separately if needed.
- Database migrations are in `supabase/migrations/` and must be run manually via Supabase SQL Editor.
