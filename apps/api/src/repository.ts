import {createClient, type SupabaseClient} from "@supabase/supabase-js";
import type {PreferenceRecord, ScanResponse} from "@docally/shared";
import {createDemoApiKeyRecord, hashApiKey, safeHashEquals, type ApiKeyRecord} from "./auth";
import type {StoredPreferenceEvent} from "./preferences";

export type StoredScan = ScanResponse & {
  url: string;
  apiKeyId: string;
  createdAt: string;
};

export type Repository = {
  findApiKey(key: string): Promise<ApiKeyRecord | null>;
  incrementUsage(keyId: string, kind: "scan" | "fix"): Promise<ApiKeyRecord | null>;
  saveScan(scan: StoredScan): Promise<void>;
  getScan(scanId: string): Promise<StoredScan | null>;
  savePreferenceEvent(event: StoredPreferenceEvent): Promise<void>;
  getPreferenceState(apiKeyId: string): Promise<PreferenceRecord[]>;
  savePreferenceState(apiKeyId: string, preferences: PreferenceRecord[]): Promise<void>;
};

export function createRepository(): Repository {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new SupabaseRepository(createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY));
  }

  return new MemoryRepository();
}

class MemoryRepository implements Repository {
  private apiKeys = new Map<string, ApiKeyRecord>();
  private scans = new Map<string, StoredScan>();
  private preferenceEvents = new Map<string, StoredPreferenceEvent[]>();
  private preferenceStates = new Map<string, PreferenceRecord[]>();

  constructor() {
    const demo = createDemoApiKeyRecord();
    this.apiKeys.set(demo.id, demo);
  }

  async findApiKey(key: string): Promise<ApiKeyRecord | null> {
    const hash = hashApiKey(key);
    return [...this.apiKeys.values()].find((record) => safeHashEquals(record.hash, hash)) || null;
  }

  async incrementUsage(keyId: string, kind: "scan" | "fix"): Promise<ApiKeyRecord | null> {
    const record = this.apiKeys.get(keyId);
    if (!record) return null;
    const next = {
      ...record,
      scansUsed: kind === "scan" ? record.scansUsed + 1 : record.scansUsed,
      fixesUsed: kind === "fix" ? record.fixesUsed + 1 : record.fixesUsed,
    };
    this.apiKeys.set(keyId, next);
    return next;
  }

  async saveScan(scan: StoredScan): Promise<void> {
    this.scans.set(scan.scan_id, scan);
  }

  async getScan(scanId: string): Promise<StoredScan | null> {
    return this.scans.get(scanId) || null;
  }

  async savePreferenceEvent(event: StoredPreferenceEvent): Promise<void> {
    const events = this.preferenceEvents.get(event.apiKeyId) || [];
    this.preferenceEvents.set(event.apiKeyId, [...events, event]);
  }

  async getPreferenceState(apiKeyId: string): Promise<PreferenceRecord[]> {
    return this.preferenceStates.get(apiKeyId) || [];
  }

  async savePreferenceState(apiKeyId: string, preferences: PreferenceRecord[]): Promise<void> {
    this.preferenceStates.set(apiKeyId, preferences);
  }
}

class SupabaseRepository implements Repository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findApiKey(key: string): Promise<ApiKeyRecord | null> {
    const hash = hashApiKey(key);
    const {data, error} = await this.supabase
      .from("api_keys")
      .select("id,prefix,hash,scans_used,fixes_used,scans_limit,fixes_limit")
      .eq("hash", hash)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      prefix: data.prefix,
      hash: data.hash,
      scansUsed: data.scans_used,
      fixesUsed: data.fixes_used,
      scansLimit: data.scans_limit,
      fixesLimit: data.fixes_limit,
    };
  }

  async incrementUsage(keyId: string, kind: "scan" | "fix"): Promise<ApiKeyRecord | null> {
    const column = kind === "scan" ? "scans_used" : "fixes_used";
    await this.supabase.rpc("increment_api_usage", {api_key_id: keyId, usage_column: column});
    const {data} = await this.supabase
      .from("api_keys")
      .select("id,prefix,hash,scans_used,fixes_used,scans_limit,fixes_limit")
      .eq("id", keyId)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      prefix: data.prefix,
      hash: data.hash,
      scansUsed: data.scans_used,
      fixesUsed: data.fixes_used,
      scansLimit: data.scans_limit,
      fixesLimit: data.fixes_limit,
    };
  }

  async saveScan(scan: StoredScan): Promise<void> {
    await this.supabase.from("scans").insert({
      scan_id: scan.scan_id,
      api_key_id: scan.apiKeyId,
      url: scan.url,
      profile: scan.profile,
      crawl: scan.crawl,
      score: scan.score,
      pages_scanned: scan.pages_scanned,
      duration_ms: scan.duration_ms,
      pages: scan.pages,
      top_issues: scan.top_issues,
      issues: scan.issues,
      summary: scan.summary,
      created_at: scan.createdAt,
    });
  }

  async getScan(scanId: string): Promise<StoredScan | null> {
    const {data, error} = await this.supabase.from("scans").select("*").eq("scan_id", scanId).maybeSingle();
    if (error || !data) return null;
    return {
      scan_id: data.scan_id,
      apiKeyId: data.api_key_id,
      url: data.url,
      profile: data.profile,
      crawl: data.crawl || "quick",
      score: data.score,
      scanned_url: data.url,
      pages_scanned: data.pages_scanned || 1,
      duration_ms: data.duration_ms || 0,
      pages: data.pages || [],
      top_issues: data.top_issues || [],
      issues: data.issues,
      summary: data.summary,
      createdAt: data.created_at,
    };
  }

  async savePreferenceEvent(event: StoredPreferenceEvent): Promise<void> {
    await this.supabase.from("preference_events").insert({
      id: event.id,
      api_key_id: event.apiKeyId,
      preference_key: event.preference_key,
      value: event.value,
      signal: event.signal,
      context: event.context,
      confidence: event.confidence,
      reason: event.reason,
      created_at: event.createdAt,
    });
  }

  async getPreferenceState(apiKeyId: string): Promise<PreferenceRecord[]> {
    const {data, error} = await this.supabase
      .from("preference_states")
      .select("preferences")
      .eq("api_key_id", apiKeyId)
      .maybeSingle();
    if (error || !data) return [];
    return data.preferences || [];
  }

  async savePreferenceState(apiKeyId: string, preferences: PreferenceRecord[]): Promise<void> {
    await this.supabase.from("preference_states").upsert(
      {
        api_key_id: apiKeyId,
        preferences,
        updated_at: new Date().toISOString(),
      },
      {onConflict: "api_key_id"},
    );
  }
}
