# DocAlly Platform

DocAlly is now shaped as a developer product: Lighthouse-style accessibility scanning with OpenAI-style API ergonomics.

## Active Product

- `apps/api` - Hono + Node.js API with `/v1/scan` and `/v1/fix`.
- `apps/web` - Dark developer dashboard/playground at `/dashboard`.
- `packages/shared` - Shared scan/fix schemas, issue types, profiles, scoring, and summaries.

The earlier Chrome extension remains preserved in `apps/extension`, but it is not the primary product surface for this milestone.

## Local Development

```bash
npm install
npm run dev:api
npm run dev:web
```

Defaults:

- API: `http://localhost:8787`
- Dashboard: `http://localhost:3000/dashboard`
- Demo API key: `dk_test_docally_demo_key`

## API

### `POST /v1/scan`

```bash
curl http://localhost:8787/v1/scan \
  -H "Authorization: Bearer dk_test_docally_demo_key" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","profile":"all"}'
```

### `POST /v1/fix`

```bash
curl http://localhost:8787/v1/fix \
  -H "Authorization: Bearer dk_test_docally_demo_key" \
  -H "Content-Type: application/json" \
  -d '{"scan_id":"scan_abc123","issue_ids":["issue_001"],"profile":"all"}'
```

## Production Targets

- Railway EU for API hosting.
- Supabase for API keys, scan history, and usage.
- Upstash Redis + BullMQ for queued scan execution.
- Vercel for the dashboard.
- Claude for language complexity analysis and copy fixes.

Local development works without Supabase, Redis, or Claude credentials by using an in-memory repository and deterministic demo analysis.
