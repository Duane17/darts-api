// src/controllers/standings.controller.ts
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { RecomputeStandingDto } from "../dto/result.dto";
import { recomputeStandings } from "../services/standings";

// Accept season from query, tolerate arrays, allow missing to enable default resolution
const GetStandingsQuery = z.object({
  season: z.preprocess(v => (Array.isArray(v) ? v[0] : v), z.string().trim().min(1)).optional(),
});

// Resolve the most recent season present in standings
async function getLatestSeason(): Promise<string | null> {
  const seasons = await prisma.standing.findMany({
    select: { season: true },
    distinct: ["season"],
    orderBy: { season: "desc" },
    take: 1,
  });
  return seasons[0]?.season ?? null;
}

// Shape the response for UI consumption
type StandingRowDTO = {
  rank: number;
  teamId: string;
  teamName: string;
  teamSlug: string;
  teamLogoUrl: string | null;
  season: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  // Provide both a string and parsed array so UI can choose either
  last5: string | null;
  last5Array: string[]; // e.g. ["W","W","W","L","W"]
};

export async function getStandings(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = GetStandingsQuery.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query", details: parsed.error.format() });
    }

    // Use provided season or fall back to latest available
    const season = parsed.data?.season ?? (await getLatestSeason());
    if (!season) {
      return res.status(404).json({
        error: "No seasons found in standings",
        hint: "Seed standings or recompute first",
      });
    }

    // Ordered by your tie-breakers
    const rows = await prisma.standing.findMany({
      where: { season },
      include: { team: { select: { id: true, name: true, slug: true, logoUrl: true } } },
      orderBy: [{ points: "desc" }, { goalDiff: "desc" }, { goalsFor: "desc" }],
    });

    if (rows.length === 0) {
      const seasons = await prisma.standing.findMany({
        select: { season: true },
        distinct: ["season"],
        orderBy: { season: "asc" },
      });
      return res.status(404).json({
        error: `No standings found for season "${season}"`,
        availableSeasons: seasons.map(s => s.season),
        hint: "Call as /standings?season=<one-of-available-seasons>",
      });
    }

    // Compute rank and map to DTO
    const table: StandingRowDTO[] = rows.map((r, idx) => {
      const last5Array =
        typeof r.last5 === "string" && r.last5.length
          ? r.last5.split(",").map(s => s.trim()).filter(Boolean)
          : [];
      return {
        rank: idx + 1,
        teamId: r.team.id,
        teamName: r.team.name,
        teamSlug: r.team.slug,
        teamLogoUrl: r.team.logoUrl ?? null,
        season: r.season,
        played: r.played,
        won: r.won,
        drawn: r.drawn,
        lost: r.lost,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        goalDiff: r.goalDiff,
        points: r.points,
        last5: r.last5 ?? null,
        last5Array,
      };
    });

    res.json(table);
  } catch (err) {
    next(err);
  }
}

export async function postRecomputeStandings(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = RecomputeStandingDto.parse(req.body);
    await recomputeStandings(prisma, dto.season, dto.teamIds);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
