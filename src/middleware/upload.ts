import multer from "multer";
import path from "path";
import fs from "fs";
import { toSlug } from "../lib/slug";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const TEAM_UPLOAD_DIR = path.join(UPLOAD_ROOT, "teams");

fs.mkdirSync(TEAM_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEAM_UPLOAD_DIR),
  filename: (req, file, cb) => {
    // try to build a filename from posted name (fallback to 'team')
    const base = toSlug(String((req.body?.name ?? "team") || "team"));
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
  if (!ok) return cb(new Error("Only JPEG, PNG, WEBP, GIF are allowed"));
  cb(null, true);
}

export const uploadTeamLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
}).single("logo"); // field name: logo
