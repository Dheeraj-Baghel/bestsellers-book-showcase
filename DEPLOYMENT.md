# Field Manuals showcase — deployment

The user explicitly asked for the GitHub push and Vercel deployment (26 October 2026).

- **Live site:** https://bestsellers-book-showcase-softtech1.vercel.app
  (Vercel's generated production alias; the `-softtech10` hostname was not assigned,
  so `bestsellers-book-showcase-softtech10.vercel.app` returns 404 — use the link above).
- **GitHub repository:** https://github.com/Dheeraj-Baghel/bestsellers-book-showcase — **private**.
- **Production branch:** `main`, connected to Vercel's GitHub integration; every push
  to `main` deploys automatically.
- **Vercel project:** `bestsellers-book-showcase-softtech10`, existing `softtech10`
  Hobby scope (personal/non-commercial use; free-tier quotas apply).

## Build

- Framework **Vite**, Node **24.x** (package `engines` + project setting).
- [vercel.json](vercel.json): `npm ci`, `npm run build` (exact-source verification,
  strict typecheck, Vite build), output `dist/`, plus security headers
  (nosniff, referrer policy, permissions policy, `X-Frame-Options: SAMEORIGIN` —
  SAMEORIGIN rather than DENY because the component renders the authored document in
  a same-origin iframe).
- No environment variables, secrets, backend or paid add-on.
- Git ignores `node_modules`, `dist`, `.env*` and `.vercel/`; `.vercelignore` keeps test
  artifacts out of build uploads.

## Licensing

The vendored ThreeUI source and canonical document are MIT-licensed (Meng To); fonts
are OFL 1.1. The licence/notice files ship in the repository and are publicly served at
`/third-party/threeui/` (LICENSE, FONT-LICENSES.md, ASSET-LICENSES.md,
THIRD_PARTY_NOTICES.md). The canonical page is self-contained; no external catalog
media is redistributed.

## Changes made for deployment

- Added `.gitignore`, `.vercelignore`, `vercel.json` and the Node 24 `engines` field.
- Added a small app-shell favicon (`public/favicon.svg`): the first live browser run
  failed only on Chrome's `/favicon.ico` 404 probe (the local test server had masked it).
  Vendored files are unchanged and still hash-verified on every build.
- `tests/browser.mjs` accepts an optional `TEST_BASE_URL`.
- Commits use the GitHub noreply author so Vercel Hobby does not block Git builds.

## Live verification (anonymous, no Vercel login)

- **19/19 real-Chrome checks passed against the live URL**: served HTML SHA-256
  matches revision `7c1ed1ca4a4c`, typography overrides, book open/close, menu,
  decodable embedded H.264 video, phone layout and zero console errors. See
  [live results](artifacts/testing/live/browser-results.json) and
  [live desktop hero](artifacts/testing/live/hero-desktop.png).
- HTTP: app shell, JS/CSS, 3.5 MB document, favicon and four licence files return 200;
  unknown paths 404; security headers and HSTS present.

Not verified: Safari/Firefox and physical devices.