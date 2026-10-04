# LedgerPulse Frontend

React + Vite frontend for LedgerPulse invoice and expense management.

## Architecture

`Firebase Auth -> Flask API -> PostgreSQL`

The browser uses Firebase only for identity. Business data is read and written through the authenticated Flask API. Demo mode is isolated to browser-local sample data.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The Vite development server proxies `/api` to `http://localhost:5000` by default. Set `VITE_API_PROXY_TARGET` when the backend runs elsewhere.

## Production build

```bash
npm run build
```

The included `Dockerfile` (renamed from the source ZIP's frontend Dockerfile) builds the SPA and serves it with Nginx. Pass `--build-arg BACKEND_UPSTREAM=<host:port>` when the frontend proxy is not using the default `backend:5000`.

## Firebase

Configure the Firebase Web SDK values in `.env.local`. Do not put Firebase Admin credentials in the frontend repository.
