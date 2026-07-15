# ERP-Daichi Frontend

Next.js UI for the Daichi ERP dashboard. Pages and NextAuth only; business logic calls the backend API.

## Setup

```bash
npm install
cp .env.example .env
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (browser) |
| `API_URL` | Backend API URL (server-side auth) |
| `NEXTAUTH_URL` | This app's URL |
| `NEXTAUTH_SECRET` | Same as backend `JWT_SECRET` |
| `AUTH_TRUST_HOST` | Set to `true` on Vercel |

## Run

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server → http://localhost:3000 |
| `npm run build` | Production build |
| `npm start` | Production server |

## Deploy (Vercel)

1. Import [ERP-Daichi-frontend](https://github.com/rohitnage18/ERP-Daichi-frontend) on Vercel
2. Set env vars above with your Render backend URL
3. Deploy

Backend repo: [ERP-Daichi-backend](https://github.com/rohitnage18/ERP-Daichi-backend)
