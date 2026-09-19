# Ganesha's Modak Rush — Vercel + Supabase

## Features
- Mobile-first responsive game
- Easy / Medium / Hard rounds
- Festival Web Audio
- Player names
- Persistent online high scores
- Top-10 online leaderboard
- Anonymous Supabase Auth — no email/password required
- LocalStorage fallback

## Supabase setup
1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase-schema.sql`.
4. Enable Anonymous Sign-Ins under Authentication → Sign In / Providers.
5. Copy your Project URL and Publishable Key from the Supabase Connect/API Keys area.
6. Put them in `supabase-config.js`.

Never put a `service_role` or `sb_secret_...` key in browser code.

## Vercel
Push the whole folder to GitHub, then import the repository into Vercel.
For this static project:
- Framework: Other
- Build command: blank
- Output directory: `.`
- Deploy

## Player separation
Each browser receives a unique Supabase anonymous Auth user ID. That ID owns one leaderboard row, so Player A and Player B have separate high scores.

Anonymous sessions persist in browser storage. Clearing site data creates a new anonymous identity.

## Important
Client-side games cannot be completely cheat-proof. A determined user can alter browser JavaScript/network requests and submit a fake score. For strict contest anti-cheat, score submission should be validated by a trusted server/Edge Function.

Official Supabase docs:
https://supabase.com/docs/reference/javascript/installing
https://supabase.com/docs/reference/javascript/auth-signinanonymously
https://supabase.com/docs/guides/database/postgres/row-level-security
