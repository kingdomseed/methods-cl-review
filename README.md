# Methods in Computational Linguistics — Exam Review

**[study.binaryloom.io](https://study.binaryloom.io)**

An interactive flashcard app for reviewing key concepts and formulas from a Methods in Computational Linguistics course. Built as a single-page HTML/CSS/JS application with a dark academia aesthetic.

## Source Data

The flashcard content was adapted from a classmate's Anki-format text exports (`methods-formulas.txt` and `methods_concepts.txt`), covering 148 cards across two decks:

- **Concepts** (102 cards) — phonetics, corpus linguistics, annotation, distributional semantics, probability, language models, classification, clustering, evaluation metrics, and LLM training methods.
- **Formulas** (46 cards) — sine waves, Nyquist, Cohen's/Fleiss' Kappa, PMI, cosine similarity, Bayes' theorem, entropy, n-gram MLE, Laplace smoothing, perplexity, precision/recall/F1, Naive Bayes, information gain, silhouette score, and more.

## Features

- KaTeX rendering for LaTeX mathematical formulas
- Card flip animations with slide transitions
- Deck filtering (All, Concepts, Formulas, Missed, Weak)
- Session progress tracking and cross-session mastery via localStorage
- Touch swipe gestures for mobile
- Mouse drag-to-swipe with green/red color feedback for desktop
- Keyboard navigation (Space/Enter to flip, 1/Left for missed, 2/Right for known, S to skip)
- Keyboard shortcut overlay (press ?)
- Answer feedback toasts and ARIA live regions for screen readers
- Responsive layout with breakpoints for tablet, mobile, and small phones

## Deployment

Hosted on Cloudflare Pages. Deploy manually with:

```
npx wrangler pages deploy . --project-name=methods-cl-review
```

---

Built entirely in [QoderWork](https://qoder.com/qoderwork) — from parsing the Anki exports to writing the app, styling it, deploying it, and adding accessibility features, all through conversation.
