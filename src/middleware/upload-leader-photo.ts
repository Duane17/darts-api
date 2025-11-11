import multer from "multer";
import path from "path";
import fs from "fs";
import { toSlug } from "../lib/slug";
import { toUploadWebPath } from "../utils/uploads";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const LEADER_UPLOAD_DIR = path.join(UPLOAD_ROOT, "leaders");

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}
ensureDir(LEADER_UPLOAD_DIR);

// Strict MIME to extension map
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LEADER_UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Build from posted name or slug; fallback to "leader"
    const base = toSlug(String(req.body?.name ?? req.body?.slug ?? "leader").trim() || "leader");
    const ext = EXT_BY_MIME[file.mimetype] ?? (path.extname(file.originalname || "").toLowerCase() || ".jpg");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ok = Object.prototype.hasOwnProperty.call(EXT_BY_MIME, file.mimetype);
  if (!ok) return cb(new Error("Only JPEG, PNG, WEBP, GIF are allowed"));
  cb(null, true);
}

export const uploadLeaderPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
}).single("photo"); // field name: photo

/**
 * Helper for controllers to persist a normalized web path.
 * Returns a clean "/uploads/leaders/xxx.ext" or an empty string.
 */
export function getLeaderPhotoWebPath(file?: Express.Multer.File): string {
  if (!file) return "";
  return toUploadWebPath(file.path || file.filename || "");
}
