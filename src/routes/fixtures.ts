import { Router } from "express";
import {
  listFixtures,
  createFixtureHandler,
  updateFixtureHandler,
  deleteFixtureHandler,
} from "../controllers/fixtures.controller";
import { requireAdmin } from "../middleware/auth";

export const fixturesRouter = Router();

// Public read
fixturesRouter.get("/", listFixtures);

// Admin writes
fixturesRouter.post("/", createFixtureHandler);
fixturesRouter.patch("/:id", updateFixtureHandler);
fixturesRouter.delete("/:id", requireAdmin, deleteFixtureHandler);
