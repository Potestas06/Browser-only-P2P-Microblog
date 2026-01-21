export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const pairs = keys.map((k) => JSON.stringify(k) + ":" + canonicalize(obj[k]));
  return "{" + pairs.join(",") + "}";
}

export async function objectId(payload: unknown): Promise<string> {
  const canonical = canonicalize(payload);
  const encoded = new TextEncoder().encode(canonical);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
