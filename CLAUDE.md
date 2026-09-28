# CLAUDE.md

Guidance for agents working in this repository.

## Project overview

This site used to be a standalone flashcard app for Methods in Computational Linguistics. It is now only a redirect: `study.binaryloom.io` sends every visitor to `https://methods-cl-study-guide.vercel.app/flashcards`, where the reviewed FSRS deck lives. Do not add card content here; edit the study guide instead.

## Files

- `_redirects` — Cloudflare Pages rules: `/`, `/index.html`, `/methods-flashcards`, and `/methods-flashcards.html` return 301 to the study guide.
- `index.html`, `methods-flashcards.html` — identical fallback pages: `<meta http-equiv="refresh">`, `location.replace(...)`, a manual link, and `<meta name="robots" content="noindex">`.
- `CNAME` — custom domain (`study.binaryloom.io`).
- `tests/redirect.spec.ts` — Playwright checks for the redirect pages.

If the target URL changes, update `_redirects`, both HTML pages, and the test together.

## Commands

```sh
npm test
npx wrangler pages deploy . --project-name=methods-cl-review
```
