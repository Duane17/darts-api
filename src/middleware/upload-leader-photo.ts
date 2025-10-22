import multer from "multer";
import path from "path";
import fs from "fs";
import { toSlug } from "../lib/slug";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const LEADER_UPLOAD_DIR = path.join(UPLOAD_ROOT, "leaders");

fs.mkdirSync(LEADER_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LEADER_UPLOAD_DIR),
  filename: (req, file, cb) => {
    // build filename from posted name or slug; fallback to 'leader'
    const baseFromName = toSlug(String((req.body?.name ?? req.body?.slug ?? "leader") || "leader"));
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${baseFromName}-${Date.now()}${ext}`);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
  if (!ok) return cb(new Error("Only JPEG, PNG, WEBP, GIF are allowed"));
  cb(null, true);
}

export const uploadLeaderPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
}).single("photo"); // field name: photo
