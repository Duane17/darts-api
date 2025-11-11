import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { toUploadWebPath } from "../utils/uploads";
import { toSlug } from "../lib/slug";

// Root uploads directory
const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");

// Allowed logical buckets to keep storage tidy
const ALLOWED_CATEGORIES = new Set([
  "home",
  "about",
  "teams",
  "leaders",
  "posts",
  "announcements",
  "misc",
]);

// Strict MIME to extension map
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

/**
 * Extract and validate the category from body or query.
 * Defaults to "misc" if not provided. Returns null if invalid.
 */
function pickCategory(req: Request): string | null {
  const raw = String((req.body as any)?.category ?? (req.query as any)?.category ?? "misc")
    .trim()
    .toLowerCase();

  if (!/^[a-z0-9_-]{3,32}$/.test(raw)) return null;
  if (!ALLOWED_CATEGORIES.has(raw)) return null;
  return raw;
}

// Multer storage configured per request
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const category = pickCategory(req);
    if (!category) return cb(new Error("INVALID_CATEGORY"), "");
    const dir = path.join(UPLOAD_ROOT, category);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const base = toSlug(String((req.body as any)?.name ?? "image").trim() || "image");
    const mappedExt =
      EXT_BY_MIME[file.mimetype] ??
      (path.extname(file.originalname || "").toLowerCase() || ".jpg");
    cb(null, `${base}-${Date.now()}${mappedExt}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ok = Object.prototype.hasOwnProperty.call(EXT_BY_MIME, file.mimetype);
  if (!ok) return cb(new Error("UNSUPPORTED_MEDIA_TYPE"));
  cb(null, true);
}

// Max 5 MB to allow hero backgrounds; field name is "image"
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("image");

/**
 * POST /uploads/image
 * Accepts multipart form with field "image" and category in body or query.
 * Returns { path: "/uploads/<category>/<filename>" } on success.
 */
export function uploadImage(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (err: any) => {
    if (err) {
      if (err?.message === "INVALID_CATEGORY") {
        return res.status(400).json({ error: "Invalid or missing category" });
      }
      if (err?.message === "UNSUPPORTED_MEDIA_TYPE") {
        return res.status(415).json({ error: "Only JPEG, PNG, WEBP, GIF are allowed" });
      }
      if (err?.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File too large" });
      }
      return next(err);
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Use field name 'image'." });
    }

    const webPath = toUploadWebPath(req.file.path || req.file.filename || "");
    if (!webPath.startsWith("/uploads/")) {
      return res.status(500).json({ error: "Failed to persist upload path" });
    }

    return res.status(200).json({ path: webPath });
  });
}
