import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  listTeams,
  getTeamById,
  getTeamBySlug,
  createTeamHandler,
  updateTeamHandler,
  deleteTeamHandler,
} from "../controllers/teams.controller";

const router = Router();

// Ensure upload dir exists
const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const TEAM_UPLOAD_DIR = path.join(UPLOAD_ROOT, "teams");
fs.mkdirSync(TEAM_UPLOAD_DIR, { recursive: true });

// Configure multer disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEAM_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safeBase = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_");
    cb(null, `${ts}_${safeBase}`);
  },
});

const upload = multer({ storage });

// Routes
router.get("/", listTeams);
router.get("/:id", getTeamById);
router.get("/slug/:slug", getTeamBySlug);

// Use upload.single("logo") so the controller can read req.file
router.post("/", upload.single("logo"), createTeamHandler);
router.patch("/:id", upload.single("logo"), updateTeamHandler);
router.delete("/:id", deleteTeamHandler);

export { router as teamsRouter };
