import {Hono} from "hono";
import {cors} from "hono/cors";
import {fixRequestSchema, preferenceEventRequestSchema, preferencePatchRequestSchema, scanRequestSchema, weakSignalRequestSchema} from "@docally/shared";
import {demoApiKey, extractBearerKey, isWellFormedApiKey} from "./auth";
import {generateFixes} from "./fixes";
import {
  buildPreferenceState,
  disablePreference,
  patchPreferenceRecord,
  updatePreferenceRecord,
  updatePreferenceFromWeakSignal,
  weakSignalToPreferenceUpdate,
  type StoredPreferenceEvent,
} from "./preferences";
import {createRepository, type Repository} from "./repository";
import {scanUrl} from "./scanner";

export function createApp(repository: Repository = createRepository()) {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: (origin) => origin || "*",
      allowHeaders: ["content-type", "authorization"],
      allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    }),
  );

  app.get("/health", (context) =>
    context.json({
      ok: true,
      service: "docally-api",
      product: "developer-scan-fix",
      demo_api_key: demoApiKey,
      supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      redisConfigured: Boolean(process.env.REDIS_URL),
      aiProviderConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    }),
  );

  app.get("/v1/usage", async (context) => {
    const auth = await authenticate(context.req.header("authorization"), repository);
    if (!auth.ok) return context.json(auth.error, auth.status);
    return context.json({
      api_key_prefix: auth.key.prefix,
      scans: {used: auth.key.scansUsed, limit: auth.key.scansLimit},
      fixes: {used: auth.key.fixesUsed, limit: auth.key.fixesLimit},
    });
  });

  app.post("/v1/scan", async (context) => {
    const auth = await authenticate(context.req.header("authorization"), repository);
    if (!auth.ok) return context.json(auth.error, auth.status);

    const body = await context.req.json().catch(() => null);
    const parsed = scanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return context.json({code: "BAD_REQUEST", message: "Send a valid URL and profile.", retryable: false}, 400);
    }

    try {
      const result = await scanUrl(parsed.data.url, parsed.data.profile, parsed.data.crawl);
      await repository.saveScan({
        ...result,
        url: parsed.data.url,
        apiKeyId: auth.key.id,
        createdAt: new Date().toISOString(),
      });
      await repository.incrementUsage(auth.key.id, "scan");
      return context.json(result);
    } catch (error) {
      console.error("[DocAlly API] scan failed", error);
      return context.json({code: "FETCH_FAILED", message: "DocAlly could not fetch or scan that URL.", retryable: true}, 502);
    }
  });

  app.post("/v1/fix", async (context) => {
    const auth = await authenticate(context.req.header("authorization"), repository);
    if (!auth.ok) return context.json(auth.error, auth.status);

    const body = await context.req.json().catch(() => null);
    const parsed = fixRequestSchema.safeParse(body);
    if (!parsed.success) {
      return context.json({code: "BAD_REQUEST", message: "Send scan_id, issue_ids, and profile.", retryable: false}, 400);
    }

    const scan = await repository.getScan(parsed.data.scan_id);
    if (!scan) {
      return context.json({code: "NOT_FOUND", message: "No scan was found for that scan_id.", retryable: false}, 404);
    }

    const fixes = await generateFixes(scan, parsed.data.issue_ids, parsed.data.profile);
    await repository.incrementUsage(auth.key.id, "fix");
    return context.json(fixes);
  });

  app.post("/v1/preferences/events", async (context) => {
    const auth = await authenticate(context.req.header("authorization"), repository);
    if (!auth.ok) return context.json(auth.error, auth.status);

    const body = await context.req.json().catch(() => null);
    const parsed = preferenceEventRequestSchema.safeParse(body);
    if (!parsed.success) {
      return context.json({code: "BAD_REQUEST", message: "Send a valid preference event.", retryable: false}, 400);
    }

    const now = new Date().toISOString();
    const event: StoredPreferenceEvent = {
      ...parsed.data,
      id: `pref_evt_${crypto.randomUUID().slice(0, 8)}`,
      apiKeyId: auth.key.id,
      createdAt: now,
    };
    const current = await repository.getPreferenceState(auth.key.id);
    const existing = current.find((preference) => preference.preference_key === parsed.data.preference_key);
    const updated = updatePreferenceRecord(existing, parsed.data, now);
    const nextState = upsertPreference(current, updated);

    await repository.savePreferenceEvent(event);
    await repository.savePreferenceState(auth.key.id, nextState);

    return context.json({
      event_id: event.id,
      preference: updated,
      state: buildPreferenceState(nextState),
    });
  });

  app.post("/v1/preferences/weak-signals", async (context) => {
    const auth = await authenticate(context.req.header("authorization"), repository);
    if (!auth.ok) return context.json(auth.error, auth.status);

    const body = await context.req.json().catch(() => null);
    const parsed = weakSignalRequestSchema.safeParse(body);
    if (!parsed.success) {
      return context.json({code: "BAD_REQUEST", message: "Send a valid weak preference signal.", retryable: false}, 400);
    }

    const now = new Date().toISOString();
    const weakUpdate = weakSignalToPreferenceUpdate(parsed.data);
    const current = await repository.getPreferenceState(auth.key.id);
    const existing = current.find((preference) => preference.preference_key === weakUpdate.event.preference_key);
    const updated = updatePreferenceFromWeakSignal(existing, parsed.data, now);
    const nextState = upsertPreference(current, updated);
    const event: StoredPreferenceEvent = {
      ...weakUpdate.event,
      id: `pref_evt_${crypto.randomUUID().slice(0, 8)}`,
      apiKeyId: auth.key.id,
      createdAt: now,
    };

    await repository.savePreferenceEvent(event);
    await repository.savePreferenceState(auth.key.id, nextState);

    return context.json({
      event_id: event.id,
      preference: updated,
      state: buildPreferenceState(nextState),
    });
  });

  app.get("/v1/preferences/state", async (context) => {
    const auth = await authenticate(context.req.header("authorization"), repository);
    if (!auth.ok) return context.json(auth.error, auth.status);

    const preferences = await repository.getPreferenceState(auth.key.id);
    return context.json(buildPreferenceState(preferences));
  });

  app.patch("/v1/preferences/state", async (context) => {
    const auth = await authenticate(context.req.header("authorization"), repository);
    if (!auth.ok) return context.json(auth.error, auth.status);

    const body = await context.req.json().catch(() => null);
    const parsed = preferencePatchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return context.json({code: "BAD_REQUEST", message: "Send valid preference edits or undo keys.", retryable: false}, 400);
    }

    const now = new Date().toISOString();
    const current = await repository.getPreferenceState(auth.key.id);
    let nextState = current;

    for (const key of parsed.data.undo_preference_keys) {
      const existing = nextState.find((preference) => preference.preference_key === key);
      if (existing) nextState = upsertPreference(nextState, disablePreference(existing, now));
    }

    for (const edit of parsed.data.preferences) {
      const existing = nextState.find((preference) => preference.preference_key === edit.preference_key);
      const updated = patchPreferenceRecord(existing, edit, now);
      nextState = upsertPreference(nextState, updated);
    }

    await repository.savePreferenceState(auth.key.id, nextState);
    return context.json(buildPreferenceState(nextState));
  });

  return app;
}

function upsertPreference(preferences: Awaited<ReturnType<Repository["getPreferenceState"]>>, updated: (typeof preferences)[number]) {
  const others = preferences.filter((preference) => preference.preference_key !== updated.preference_key);
  return [...others, updated].sort((a, b) => a.preference_key.localeCompare(b.preference_key));
}

async function authenticate(authorization: string | undefined, repository: Repository) {
  const key = extractBearerKey(authorization);
  if (!key || !isWellFormedApiKey(key)) {
    return {
      ok: false as const,
      status: 401 as const,
      error: {code: "UNAUTHORIZED", message: "Use Authorization: Bearer dk_test_... or dk_live_...", retryable: false},
    };
  }

  const record = await repository.findApiKey(key);
  if (!record) {
    return {
      ok: false as const,
      status: 401 as const,
      error: {code: "UNAUTHORIZED", message: "The API key is not valid.", retryable: false},
    };
  }

  return {ok: true as const, key: record};
}
