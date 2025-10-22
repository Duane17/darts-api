import { Router } from "express";
import {
  listLeaders,
  getLeaderBySlug,
  createLeaderHandler,
  updateLeaderHandler,
  deleteLeaderHandler,
} from "../controllers/leaders.controller";
import { requireAdmin } from "../middleware/auth";
import { uploadLeaderPhoto } from "../middleware/upload-leader-photo";

export const leadersRouter = Router();

// Public reads
leadersRouter.get("/", listLeaders);
leadersRouter.get("/:slug", getLeaderBySlug);
leadersRouter.post("/", uploadLeaderPhoto, createLeaderHandler);
leadersRouter.patch("/:id", uploadLeaderPhoto, updateLeaderHandler);
leadersRouter.delete("/:id", deleteLeaderHandler);
