import {createHash, timingSafeEqual} from "node:crypto";

export const demoApiKey = process.env.DOCALLY_DEMO_API_KEY || "dk_test_docally_demo_key";

export type ApiKeyRecord = {
  id: string;
  prefix: string;
  hash: string;
  scansUsed: number;
  fixesUsed: number;
  scansLimit: number;
  fixesLimit: number;
};

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function createDemoApiKeyRecord(): ApiKeyRecord {
  return {
    id: "key_demo",
    prefix: demoApiKey.slice(0, 12),
    hash: hashApiKey(demoApiKey),
    scansUsed: 47,
    fixesUsed: 23,
    scansLimit: 100,
    fixesLimit: 100,
  };
}

export function extractBearerKey(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function isWellFormedApiKey(key: string): boolean {
  return /^dk_(test|live)_[A-Za-z0-9_]+$/.test(key);
}

export function safeHashEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
