export function coerceBoolean(input: unknown, defaultValue = false): boolean {
  if (typeof input === "boolean") return input;
  if (typeof input === "string") {
    const v = input.trim().toLowerCase();
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no") return false;
  }
  return defaultValue;
}

export function toSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
