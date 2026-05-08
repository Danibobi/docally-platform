export type NormalizedScanUrl =
  | {ok: true; url: string}
  | {ok: false; error: string};

export const scanUrlError = "Could not scan this URL. Check it's accessible and try again.";

export function normalizeScanUrl(input: string): NormalizedScanUrl {
  const trimmed = input.trim();
  if (!trimmed) return {ok: false, error: scanUrlError};

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) return {ok: false, error: scanUrlError};
    if (!isValidHostname(parsed.hostname)) return {ok: false, error: scanUrlError};
    return {ok: true, url: parsed.href};
  } catch {
    return {ok: false, error: scanUrlError};
  }
}

function isValidHostname(hostname: string): boolean {
  if (hostname === "localhost") return true;
  if (!hostname.includes(".")) return false;
  return hostname
    .split(".")
    .every((part) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(part));
}
