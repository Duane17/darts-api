import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Order by points, then goal difference, then goals for */
const ORDER = [
  { points: "desc" as const },
  { goalDiff: "desc" as const },
  { goalsFor: "desc" as const },
];

export async function getStandings(req: Request, res: Response) {
  try {
    const { season, group } = req.query as { season?: string; group?: string };

    if (!season) {
      return res.status(400).json({ error: "season is required" });
    }

    const rows = await prisma.standing.findMany({
      where: {
        season,
        ...(group ? { group } : {}),
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true, // important
          },
        },
      },
      orderBy: ORDER,
    });

    // Denormalize a top level field for convenience on the client
    const items = rows.map((r) => ({
      ...r,
      teamLogoUrl: r.team?.logoUrl ?? null,
    }));

    res.json({ season, group: group ?? null, items });
  } catch (err) {
    console.error("getStandings error", err);
    res.status(500).json({ error: "Failed to fetch standings" });
  }
}

/** Recompute standings for a season using the same logic as in results controller */
export async function postRecomputeStandings(req: Request, res: Response) {
  try {
    const { season } = req.body as { season: string };
    if (!season) return res.status(400).json({ error: "season is required" });

    // Delegate to results.controller logic would be ideal if shared as a service.
    // For simplicity, we inline a tiny re-aggregation here.
    const fixtures = await prisma.fixture.findMany({
      where: { season, status: "PLAYED", isBye: false },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        result: { select: { homeScore: true, awayScore: true } },
      },
    });

    type Acc = {
      played: number; won: number; drawn: number; lost: number;
      gf: number; ga: number; gd: number; pts: number;
    };
    const acc = new Map<string, Acc>();

    function ensure(tid: string) {
      if (!acc.has(tid))
        acc.set(tid, {
          played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0,
        });
      return acc.get(tid)!;
    }

    for (const f of fixtures) {
      if (!f.result || !f.homeTeamId || !f.awayTeamId) continue;
      const { homeScore: hs, awayScore: as } = f.result;

      const h = ensure(f.homeTeamId);
      const a = ensure(f.awayTeamId);

      h.played += 1;
      a.played += 1;
      h.gf += hs; h.ga += as; h.gd = h.gf - h.ga;
      a.gf += as; a.ga += hs; a.gd = a.gf - a.ga;

      if (hs > as) { h.won += 1; a.lost += 1; h.pts += 3; }
      else if (hs < as) { a.won += 1; h.lost += 1; a.pts += 3; }
      else { h.drawn += 1; a.drawn += 1; h.pts += 1; a.pts += 1; }
    }

    const existing = await prisma.standing.findMany({
      where: { season },
      select: { teamId: true, group: true },
    });
    const groupByTeam = new Map(existing.map(s => [s.teamId, s.group ?? null]));

    const ops = [];
    for (const [teamId, s] of acc.entries()) {
      ops.push(
        prisma.standing.upsert({
          where: { season_teamId: { season, teamId } },
          update: {
            played: s.played, won: s.won, drawn: s.drawn, lost: s.lost,
            goalsFor: s.gf, goalsAgainst: s.ga, goalDiff: s.gd, points: s.pts,
            group: groupByTeam.get(teamId) ?? undefined,
          },
          create: {
            season, teamId,
            played: s.played, won: s.won, drawn: s.drawn, lost: s.lost,
            goalsFor: s.gf, goalsAgainst: s.ga, goalDiff: s.gd, points: s.pts,
            group: groupByTeam.get(teamId) ?? undefined,
          },
        })
      );
    }

    await prisma.$transaction(ops);

    const rows = await prisma.standing.findMany({
      where: { season },
      include: { team: { select: { id: true, name: true, slug: true } } },
      orderBy: ORDER,
    });

    res.json({ season, items: rows });
  } catch (err) {
    console.error("postRecomputeStandings error", err);
    res.status(500).json({ error: "Failed to recompute standings" });
  }
}
