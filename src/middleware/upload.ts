import multer from "multer";
import path from "path";
import fs from "fs";
import { toSlug } from "../lib/slug";
import { toUploadWebPath } from "../utils/uploads";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const TEAM_UPLOAD_DIR = path.join(UPLOAD_ROOT, "teams");

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}
ensureDir(TEAM_UPLOAD_DIR);

// Strict MIME to extension map prevents spoofed extensions
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEAM_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const base = toSlug(String(req.body?.name ?? "team").trim() || "team");
    const ext = EXT_BY_MIME[file.mimetype] ?? (path.extname(file.originalname || "").toLowerCase() || ".jpg");
    // Timestamped name supports long lived caching on the static mount
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ok = Object.prototype.hasOwnProperty.call(EXT_BY_MIME, file.mimetype);
  if (!ok) return cb(new Error("Only JPEG, PNG, WEBP, GIF are allowed"));
  cb(null, true);
}

export const uploadTeamLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
}).single("logo"); // field name: logo

/**
 * Helper for controllers to persist a normalized web path.
 * Returns a clean "/uploads/teams/xxx.ext" or an empty string.
 */
export function getTeamLogoWebPath(file?: Express.Multer.File): string {
  if (!file) return "";
  return toUploadWebPath(file.path || file.filename || "");
}
