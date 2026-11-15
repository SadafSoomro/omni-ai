# Omni AI

React/Vite frontend. Backend: SadafSoomro/omni-ai-backend.

Use Node.js 24. Run `npm ci`, copy `.env.example` to `.env`, then `npm run dev`. Local backend: localhost:9000.

Live site: https://omni-ai-eosin-psi.vercel.app

Vercel uses the Vite preset. The included `/api` rewrite proxies to https://omni-ai-backend.vercel.app, keeping API calls and guest cookies on the frontend origin. Leave VITE_API_BASE_URL unset or set it to `/api`. Set backend FRONTEND_URL to the frontend origin. Never put server secrets in VITE variables.

Use same-site custom domains or a same-origin API reverse proxy for dependable guest cookies. Unrelated domains may block cookies.

Checks: `npm test` and `npm run build`. PWA installation is enabled in production; updates do not require reinstalling.
