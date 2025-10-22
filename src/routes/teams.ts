import { Router } from "express";
import {
  listTeams,
  getTeamById,
  getTeamBySlug,
  createTeamHandler,
  updateTeamHandler,
  deleteTeamHandler,
} from "../controllers/teams.controller";
import { requireAdmin } from "../middleware/auth";
import { uploadTeamLogo } from "../middleware/upload";

export const teamsRouter = Router();

// Public reads
teamsRouter.get("/", listTeams);
teamsRouter.get("/:id", getTeamById);
teamsRouter.get("/slug/:slug", getTeamBySlug);

// Admin writes
teamsRouter.post("/", uploadTeamLogo, createTeamHandler);
teamsRouter.patch("/:id", uploadTeamLogo, updateTeamHandler);
teamsRouter.delete("/:id", deleteTeamHandler);