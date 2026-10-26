# Bestsellers Book Showcase — standalone exact-source ThreeUI app

A standalone React/TypeScript/Vite application that renders the ThreeUI
`<BestsellersBookShowcase />` ("Field Manuals — Tools for Thought") from its
exact registered source. Everything the app needs lives inside this folder:
no other workspace project, and no npm copy of the ThreeUI package, is
referenced at build or runtime.

**Live site:** [https://bestsellers-book-showcase-softtech1.vercel.app](https://bestsellers-book-showcase-softtech1.vercel.app)
· **Source (private):** [Dheeraj-Baghel/bestsellers-book-showcase](https://github.com/Dheeraj-Baghel/bestsellers-book-showcase)
· [deployment notes](DEPLOYMENT.md)

## Run

```bash
npm install          # first time only
npm run dev          # http://127.0.0.1:4334
```

- `npm run build` — exact-source verification + strict typecheck + production build
- `npm run preview` — serve the production build on 4334
- `npm run test:browser` — real-Chrome workflow checks against the production build
  (`TEST_BASE_URL=<origin> npm run test:browser` runs them against a deployment;
  results go to `artifacts/testing/live/`)
- `npm run verify:source` — hash-verify every vendored file on its own

## Exact source

The requested revision is canonical HTML SHA-256 `7c1ed1ca4a4c…`. All four
registered files are vendored byte-for-byte and re-verified on every build:

| Registered path | Role | SHA-256 |
| --- | --- | --- |
| `src/shaders/landing-pages/LandingPages.tsx` | component | `4d379461ad00…` |
| `src/shaders/landing-pages/LandingPageFrame.tsx` | frame | `61de2cc50888…` |
| `public/landing-pages/bestsellers-book-showcase.html` | canonical document | `7c1ed1ca4a4c…` |
| `src/shaders/threeui.css` | shared style | `efe4447139f1…` |

Provenance details, including where each byte came from, are recorded in
[vendor/threeui/provenance.json](vendor/threeui/provenance.json):

- The React/CSS text files come from the registered source bundle
  (`threeui.com/source-code/bestsellers-book-showcase.json`, archived at
  [vendor/threeui/source-bundle.json](vendor/threeui/source-bundle.json)).
- The bundle registers the canonical HTML's hash but omits its text, and the
  live website currently serves a different revision (55 KB vs the registered
  3.5 MB). The document bytes therefore come from `@designcodeio/threeui`
  1.2.0's packaged assets, which match the required SHA-256 exactly. The
  3.5 MB page is fully self-contained: three H.264 MP4 clips, cover art and
  fonts are all embedded as data URLs, so it is served unchanged from
  [public/landing-pages/](public/landing-pages/).
- `pageTypography.ts` / `pageRecipes.ts` are support modules the component
  imports; their registered text (identical hashes) was taken from the same
  registry. The Fragment Mono font referenced by the shared stylesheet was
  decoded byte-for-byte from the package's compiled `style.css`.
- [vendor/threeui/BestsellersEntry.tsx](vendor/threeui/BestsellersEntry.tsx)
  re-exports the verbatim `BestsellersBookShowcase` function (enforced by the
  verification script) so the app can alias `@designcodeio/threeui` to the
  registered source without pulling in the catalog's 20+ unrelated pages.

[src/Scene.tsx](src/Scene.tsx) preserves the configured usage exactly:
`iowan-old-style` heading/body, weights 500/400, primary `#c3a47b`, heading
size 325, body 17, letter spacing −0.085. The verification script parses the
JSX and fails the build on any deviation.

## Verification

`npm run build` and the browser suite both pass:

- 4 registered files + 3 support files hash-verified; verbatim export and
  exact props enforced; canonical document confirmed self-contained.
- **19/19 real-Chrome checks** (Playwright `channel: "chrome"`, because the
  embedded MP4 clips need H.264): served document hash, authored structure
  (hero word, 3 book cards, brand, menu), the appended typography override
  sheet with all configured values, book open/close interaction, menu layer,
  decodable embedded video, phone-viewport layout, and zero console errors.
- Screenshots: [desktop hero](artifacts/testing/hero-desktop.png),
  [book detail](artifacts/testing/detail-desktop.png),
  [phone hero](artifacts/testing/hero-mobile.png); results in
  [browser-results.json](artifacts/testing/browser-results.json).

Safari/Firefox and physical devices remain manual checks. The dev server and
tests use port 4334 (4329–4333 are used by sibling projects, which this app
otherwise never touches).
