# Roadmap

## Phase 1 - Developer MVP

- Ship `/v1/scan` and `/v1/fix`.
- Keep demo API key local.
- Provide dashboard playground, fix viewer, and inline docs.
- Cover automated issues: contrast, alt text, reduced motion, font size, skip links, labels, lang, headings, forms.

## Phase 2 - Production API

- Add Clerk signup and API key creation in the dashboard.
- Store hashed API keys and scan history in Supabase.
- Add Redis/BullMQ scan queue.
- Add rate limits and monthly usage enforcement.

## Phase 3 - Better Analysis

- Add richer CSS cascade analysis.
- Add Claude structured output for language complexity and fixes.
- Add screenshot evidence from Playwright.
- Add framework-aware recommendations for React/Next.js apps.

## Phase 4 - Developer Workflow

- Add GitHub PR comments.
- Add CLI scan command.
- Add JSON/SARIF export.
- Add team projects, environments, and scan history.
- Add VS Code extension with diagnostics, hover explanations, and code actions backed by `/v1/fix`.

## Phase 5 - Adaptive Preference Modeling

- Keep preference modeling separate from scanner correctness.
- Add opt-in preference inspection, edit, undo, export, and delete controls.
- Learn from explicit choices first and weak behavioral signals second.
- Limit weak-signal collection to named dashboard interactions so preference learning feels inspectable, not surveillant.
- Add confidence decay, contradiction handling, and visible "why did this change?" explanations.
- Evaluate adaptation with comfort, trust, false adaptation rate, undo rate, and subgroup failure metrics instead of engagement alone.
