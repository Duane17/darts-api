import { Router } from "express";
import {
  listFixtures,
  getFixtureById,
  createFixtureHandler,
  updateFixtureHandler,
  deleteFixtureHandler,
} from "../controllers/fixtures.controller";
import { requireAdmin } from "../middleware/auth";

export const fixturesRouter = Router();

// Public read
fixturesRouter.get("/", listFixtures);
fixturesRouter.get("/:id", getFixtureById);


// Admin writes
fixturesRouter.post("/", createFixtureHandler);
fixturesRouter.patch("/:id", updateFixtureHandler);
fixturesRouter.delete("/:id", requireAdmin, deleteFixtureHandler);
