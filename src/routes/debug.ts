// src/routes/debug.ts
import { Router } from "express";
import { prisma } from "../db/prisma";

export const debugRouter = Router();

debugRouter.get("/standing-seasons", async (req, res, next) => {
  try {
    const seasons = await prisma.standing.findMany({
      select: { season: true },
      distinct: ["season"],
      orderBy: { season: "asc" },
    });
    res.json(seasons.map(s => s.season));
  } catch (e) {
    next(e);
  }
});
