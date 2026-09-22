# Alzava Battle IQ

Production frontend target: Cloudflare Pages.

Backend remains on Supabase for participant accounts, leaderboard, tests, payments, and admin APIs.

Cloudflare Pages build settings:
- Production branch: `main`
- Framework preset: Next.js (Static HTML Export)
- Build command: `npm run build`
- Build output directory: `out`
- Node.js: 22

The build generates WebP versions of heavy v0 assets, stages the legacy Battle IQ routes before Next.js export, and prunes heavyweight PNG copies from the deploy output.
Cloudflare redeploy trigger: 2026-09-22
