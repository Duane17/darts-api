// src/utils/uploads.ts
import path from "path";

const UPLOADS_PREFIX = "/uploads/";

// Accepts absolute URLs, absolute filesystem paths, or relative strings.
// Returns a clean web path like "/uploads/leaders/file.jpg".
export function toUploadWebPath(input: string): string {
  if (!input) return "";

  let s = String(input).trim();
  try {
    const url = new URL(s);
    s = url.pathname + url.search + url.hash;
  } catch {}
  s = s.replace(/\\/g, "/").replace(/^(\.\/|\/)+/, "/");
  const idx = s.toLowerCase().indexOf(UPLOADS_PREFIX);
  if (idx >= 0) {
    s = s.slice(idx);
  }
  s = s.replace(/\.\.(\/|\\)/g, "");
  if (!s.startsWith(UPLOADS_PREFIX)) {
    s = path.posix.join(UPLOADS_PREFIX, s);
  }
  s = s.replace(/\/{2,}/g, "/");
  return s;
}
