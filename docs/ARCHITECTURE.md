# DocAlly Developer Architecture

## Product Boundary

The public developer product has two core endpoints:

- `POST /v1/scan` - submit a URL and profile, receive a structured accessibility report.
- `POST /v1/fix` - submit a `scan_id` and issue IDs, receive HTML/CSS diffs.

The dashboard is a playground for these endpoints. It should not have hidden product behavior that the API cannot support.

Adaptive preference modeling is a separate beta layer. It can record opt-in preference signals and explain them, but it must not silently change scan or fix results.

## Scan Flow

1. Validate `Authorization: Bearer dk_test_...` or `dk_live_...`.
2. Validate `{ url, profile }`.
3. Fetch static HTML.
4. Use Playwright when static HTML looks like a thin SPA shell.
5. Run deterministic checks for WCAG and sensory issues.
6. Run Claude-backed analysis when configured; otherwise use deterministic language checks.
7. Store scan result and snippets for later fixes.
8. Return score, issues, summary, and `scan_id`.

## Fix Flow

1. Validate API key.
2. Load stored scan by `scan_id`.
3. Select requested issue IDs.
4. Generate HTML/CSS replacements or additions.
5. Return fix suggestions with original, fixed, and explanation.

## Persistence

Local development uses memory. Production should map the repository interface to Supabase:

- `api_keys`: hashed keys, visible prefix, usage limits.
- `scans`: scan ID, URL, profile, score, issue JSON, snippets.
- `usage_events`: monthly scan/fix counters by API key.
- `preference_events`: opt-in explicit and weak preference observations.
- `preference_states`: current explainable preference records keyed by API key or future user/team ID.

## Adaptive Preference Layer

Preference modeling is not classification. DocAlly stores preference records with context, confidence, source signal, decay period, confirmation timestamp, and contradiction history. Explicit user choices outrank weak behavioral signals. Weak signals stay below the automatic adaptation threshold and cannot override a confirmed explicit preference.

Beta endpoints:

- `POST /v1/preferences/events` - record one explicit or weak preference event.
- `POST /v1/preferences/weak-signals` - record one of the 8 approved dashboard weak-signal events without raw content.
- `GET /v1/preferences/state` - inspect active preferences, safety policy, and explanations.
- `PATCH /v1/preferences/state` - explicitly edit or undo preference records.

Safety rules are part of the response contract: opt-in is required, diagnosis inference is blocked, hidden emotional-state labels are blocked, engagement-only optimization is blocked, and personalization must be reversible.

The dashboard only tracks these weak signals: `fix_explanation_collapsed`, `fix_explanation_expanded`, `fix_skipped`, `fix_rewritten`, `flow_abandoned`, `simpler_option_chosen`, `adaptation_undone`, and `same_issue_type_skipped_3x`. These signals can nudge confidence or record contradictions, but they cannot change scan findings or silently override explicit preferences.

## Queue

The MVP executes scans inline. When Redis is configured, scan execution can move behind BullMQ while preserving the same public endpoint contract.
