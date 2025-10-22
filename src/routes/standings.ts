import { Router } from "express";
import { getStandings, postRecomputeStandings } from "../controllers/standings.controller";
import { requireAdmin } from "../middleware/auth";

export const standingsRouter = Router();

/** Get current table for a season */
standingsRouter.get("/", getStandings);

/** Recompute standings for a season, optionally limited to teamIds */
standingsRouter.post("/recompute", requireAdmin, postRecomputeStandings);
