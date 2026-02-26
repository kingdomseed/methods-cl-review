# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive flashcard web app for reviewing **Methods in Computational Linguistics** exam content. Single-page HTML/CSS/JS application with a dark academia aesthetic, hosted on Cloudflare Pages at **study.binaryloom.io**.

148 flashcards across two decks: **Concepts** (102 cards) and **Formulas** (46 cards with LaTeX math).

## Deployment

```bash
npx wrangler pages deploy . --project-name=methods-cl-review
```

No build step. The site is a single `index.html` file served as static content. `CNAME` configures the custom domain.

## Architecture

**Everything lives in `index.html`** (~1555 lines). There is no bundler, no framework, no separate CSS/JS files.

The file is structured in order:
1. **`<head>`** — CSS (lines 10–778): CSS variables in `:root`, layout, card flip animations, responsive breakpoints (tablet 768px, mobile 600px, small phones 400px), drag-to-swipe indicators, keyboard shortcut overlay, feedback toasts
2. **`<body>` HTML** (lines 780–890): Deck bar, stats row, progress bar, card stage (with drag indicators), action buttons, controls, mastery bar, completion screen, shortcut overlay
3. **`<script>` block** (lines 892–1553): All application logic

### JavaScript sections (in order):
- **Card Data** (~lines 894–1050): `FORMULAS[]` and `CONCEPTS[]` arrays — each card is `{q, a, deck}`. Formula answers contain LaTeX wrapped in `\[...\]` delimiters with `<br>` and `|`-separated descriptions.
- **Persistence layer** (~lines 1052–1116): localStorage key `mcl_flashcards_v1`. Mastery object stores `{timesKnown, timesMissed, lastResult, lastSeen}` per card. Card IDs are first 60 chars of the question text.
- **State** (~line 1118): `deck[]`, `idx`, `known` Set, `missed` Set, `currentDeck`, `flipped`, `transitioning` flag
- **Init/Render** (~lines 1139–1270): `initDeck()` handles deck filtering (all/concepts/formulas/missed/weak), Fisher-Yates shuffle, `showCard()` splits formula answers from descriptions for layout
- **Events** (~lines 1318–1548): Button handlers, keyboard shortcuts, touch swipe (60px threshold, 400ms), mouse drag-to-swipe (80px threshold) with green/red visual feedback

### Key design decisions:
- **KaTeX** loaded from CDN (v0.16.9) for rendering LaTeX formulas on card backs
- **Mastery** = known at least 2 times AND last result was "known" (`isMastered()`)
- **Weak deck** = cards where `timesMissed > timesKnown` OR `lastResult === 'missed'`
- **Skip** moves card to end of deck array without marking known/missed
- **Slide transitions** use CSS classes `slide-out`/`slide-in` with 250ms/300ms timeouts; `transitioning` flag prevents input during animations
- Card flip uses CSS 3D transform (`rotateY(180deg)`) with `backface-visibility: hidden`

### External dependencies (CDN only):
- KaTeX 0.16.9 (CSS + JS + auto-render)
- Google Fonts: DM Serif Display, IBM Plex Mono, Source Serif 4

## Source Data

`methods_concepts.txt` is the tab-separated source for the Concepts deck (question\tanswer per line). Formula cards are defined directly as JS objects with embedded LaTeX in `index.html`.

## Files

- `index.html` — The entire application (canonical, deployed)
- `methods-flashcards.html` — Identical copy of index.html (not deployed, can be removed)
- `CNAME` — Custom domain config (`study.binaryloom.io`)
- `methods_concepts.txt` — Source text for concepts deck (reference only, not loaded at runtime)

## Conventions

- All card answer text uses `|` as a delimiter between definition parts (rendered as separate `<span class="def-item">` elements)
- LaTeX formulas use `\[...\]` for display math and `\(...\)` for inline math
- CSS uses custom properties exclusively for theming (defined in `:root`)
- DOM queries use a `$` shorthand: `const $ = s => document.querySelector(s)`
- Accessibility: ARIA roles on card stage, `aria-live` region for screen reader announcements, keyboard-navigable controls
