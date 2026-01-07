GirlPower Check-In (MVP)

Firebase config and secrets
Firebase web config (apiKey, authDomain, etc.) is public in the built frontend and is not a secret. It only identifies the project; access is controlled by Firebase Authentication and Firestore Security Rules, not by hiding the config. GitHub Secrets are used to keep config out of git history and make rotation easier, but once deployed to GitHub Pages the config is visible in the JS bundle.

What this is
A fast daily check-in for athletes plus a simple coach dashboard that surfaces early warning signals (missed practice, low sleep).

Privacy model (MVP)
Athletes can only read/write their own check-ins.
Coaches can read team data for athletes on their team.
No athlete can see another athlete’s check-ins.

Deploy
This repo deploys to GitHub Pages via GitHub Actions.
Add the Firebase config as GitHub Secrets (VITE_* values).
