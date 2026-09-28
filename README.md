# Methods in Computational Linguistics — flashcards (moved)

**[study.binaryloom.io](https://study.binaryloom.io)** now redirects to the flashcards in the Methods study guide:
**[methods-cl-study-guide.vercel.app/flashcards](https://methods-cl-study-guide.vercel.app/flashcards)**.

The study guide's deck replaces this one. It was checked card by card against the lecture slides and exam protocols, schedules reviews with FSRS, renders formulas with KaTeX, and saves progress in the browser. Progress saved by the old deck (`mcl_flashcards_v1`) does not carry over.

## What this site serves

- `_redirects` — Cloudflare Pages 301 redirects from `/`, `/index.html`, `/methods-flashcards`, and `/methods-flashcards.html` to the study guide.
- `index.html` and `methods-flashcards.html` — fallback redirect pages (meta refresh, `location.replace`, and a plain link) for hosts that ignore `_redirects`. Both are marked `noindex`.
- `CNAME` — the custom domain.

## Tests

```sh
npm install
npx playwright install chromium
npm test
```

`tests/redirect.spec.ts` checks that both pages redirect to the study guide, that they still redirect and show a manual link without JavaScript, and that `_redirects` sends every legacy path there with a 301.

## Deployment

Hosted on Cloudflare Pages. Deploy manually with:

```sh
npx wrangler pages deploy . --project-name=methods-cl-review
```
