# cccc.info frontend

Frontend for the Canberra Chinese Christian Church info site: groups, posts and comments, notifications, the church library, and admin pages.

Built with Next.js (App Router), React, Redux Toolkit and Tailwind CSS. The backend is a separate Flask app (`cccc.info-backend`).

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

The backend needs to be running too. Create `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:5001   # backend address (the app calls <origin>/api/...)
NEXT_PUBLIC_RECAPTCHA_ENABLED=false                # true = reCAPTCHA on sign-up / login
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=                    # only needed when reCAPTCHA is on
```

Production values are in `.env.production`. All of these are public (they end up in the browser), so no secrets go here.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (run this before pushing to `main`) |
| `npm start` | Serve the production build |
| `npm test` | Unit tests (Jest) |
| `npm run lint` | ESLint |

## Project layout

- `src/app/` – pages (App Router), Redux slices in `src/app/features/`, API types and helpers in `src/app/types/`
- `src/components/` – shared components
- `src/hooks/` – shared hooks

## API and deployment

The API reference and the deployment runbook are kept in the backend repository (private docs), not here.
