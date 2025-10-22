import { Router } from "express";
import {
  listResults,
  getResultById,
  createResult,
  updateResult,
} from "../controllers/results.controller";
import { requireAdmin } from "../middleware/auth";

export const resultsRouter = Router();

/** Read the full list of results */
resultsRouter.get("/", listResults);

/** Read a specific result by ID */
resultsRouter.get("/:id", getResultById);

/** Create a result and update standings */
resultsRouter.post("/", createResult);

/** Update a result by id and recompute standings */
resultsRouter.patch("/:id", updateResult);
