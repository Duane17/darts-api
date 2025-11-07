import { Request, Response } from "express";
import { PrismaClient, FixtureStatus } from "@prisma/client";

const prisma = new PrismaClient();

/** Recompute standings for a season by aggregating all PLAYED fixtures with results */
async function recomputeSeasonStandings(season: string) {
  // Pull all teams that appear in fixtures for the season
  const fixtures = await prisma.fixture.findMany({
    where: { season, status: "PLAYED", isBye: false },
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      result: { select: { homeScore: true, awayScore: true } },
    },
  });

  // Build aggregates
  type Acc = {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    gd: number;
    pts: number;
  };
  const acc = new Map<string, Acc>();

  function ensure(tid: string) {
    if (!acc.has(tid))
      acc.set(tid, {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
      });
    return acc.get(tid)!;
  }

  for (const f of fixtures) {
    if (!f.result) continue;
    const { homeTeamId, awayTeamId } = f;
    if (!homeTeamId || !awayTeamId) continue;

    const hs = f.result.homeScore;
    const as = f.result.awayScore;

    const h = ensure(homeTeamId);
    const a = ensure(awayTeamId);

    h.played += 1;
    a.played += 1;

    h.gf += hs;
    h.ga += as;
    a.gf += as;
    a.ga += hs;

    h.gd = h.gf - h.ga;
    a.gd = a.gf - a.ga;

    if (hs > as) {
      h.won += 1;
      a.lost += 1;
      h.pts += 3;
    } else if (hs < as) {
      a.won += 1;
      h.lost += 1;
      a.pts += 3;
    } else {
      h.drawn += 1;
      a.drawn += 1;
      h.pts += 1;
      a.pts += 1;
    }
  }

  // Load groups from existing standings if present so we keep A or B
  const existing = await prisma.standing.findMany({
    where: { season },
    select: { teamId: true, group: true },
  });
  const groupByTeam = new Map(existing.map((s) => [s.teamId, s.group ?? null]));

  // Upsert one Standing per team
  const ops = [];
  for (const [teamId, s] of acc.entries()) {
    ops.push(
      prisma.standing.upsert({
        where: { season_teamId: { season, teamId } },
        update: {
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goalsFor: s.gf,
          goalsAgainst: s.ga,
          goalDiff: s.gd,
          points: s.pts,
          group: groupByTeam.get(teamId) ?? undefined,
        },
        create: {
          season,
          teamId,
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goalsFor: s.gf,
          goalsAgainst: s.ga,
          goalDiff: s.gd,
          points: s.pts,
          group: groupByTeam.get(teamId) ?? undefined,
        },
      })
    );
  }

  await prisma.$transaction(ops);
}

/** GET /results */
export async function listResults(req: Request, res: Response) {
  try {
    const { season, teamId, page, pageSize } = req.query;
    const take = pageSize ? Number(pageSize) : 100;
    const skip = page ? (Number(page) - 1) * take : 0;

    const where = {
      ...(season ? { fixture: { season: String(season) } } : {}),
      ...(teamId
        ? {
            OR: [
              { fixture: { homeTeamId: String(teamId) } },
              { fixture: { awayTeamId: String(teamId) } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.result.findMany({
        where,
        include: {
          fixture: {
            select: {
              id: true,
              season: true,
              week: true,
              date: true,
              homeTeam: { select: { id: true, name: true, slug: true } },
              awayTeam: { select: { id: true, name: true, slug: true } },
              type: true,
            },
          },
        },
        orderBy: [{ fixture: { date: "desc" } }],
        skip,
        take,
      }),
      prisma.result.count({ where }),
    ]);

    res.json({ total, page: Number(page ?? 1), pageSize: take, items });
  } catch (err) {
    console.error("listResults error", err);
    res.status(500).json({ error: "Failed to list results" });
  }
}

/** GET /results/:id */
export async function getResultById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const r = await prisma.result.findUnique({
      where: { id },
      include: {
        fixture: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    });
    if (!r) return res.status(404).json({ error: "Not found" });
    res.json(r);
  } catch (err) {
    console.error("getResultById error", err);
    res.status(500).json({ error: "Failed to load result" });
  }
}

/** POST /results */
export async function createResult(req: Request, res: Response) {
  try {
    const { fixtureId, homeScore, awayScore, notes } = req.body as {
      fixtureId: string;
      homeScore: number;
      awayScore: number;
      notes?: string | null;
    };

    const fx = await prisma.fixture.findUnique({ where: { id: fixtureId } });
    if (!fx) return res.status(400).json({ error: "Fixture not found" });
    if (fx.isBye) return res.status(400).json({ error: "Cannot score a bye" });

    const created = await prisma.result.create({
      data: {
        fixtureId,
        homeScore,
        awayScore,
        notes: notes ?? null,
      },
    });

    await prisma.fixture.update({
      where: { id: fixtureId },
      data: { status: "PLAYED" as FixtureStatus },
    });

    await recomputeSeasonStandings(fx.season);

    res.status(201).json(created);
  } catch (err) {
    console.error("createResult error", err);
    res.status(500).json({ error: "Failed to create result" });
  }
}

/** PATCH /results/:id */
export async function updateResult(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { homeScore, awayScore, notes } = req.body as Partial<{
      homeScore: number;
      awayScore: number;
      notes: string | null;
    }>;

    const existing = await prisma.result.findUnique({
      where: { id },
      include: { fixture: true },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const updated = await prisma.result.update({
      where: { id },
      data: {
        homeScore: homeScore ?? existing.homeScore,
        awayScore: awayScore ?? existing.awayScore,
        notes: notes ?? existing.notes,
      },
    });

    // Ensure fixture is marked played
    await prisma.fixture.update({
      where: { id: existing.fixtureId },
      data: { status: "PLAYED" },
    });

    await recomputeSeasonStandings(existing.fixture.season);

    res.json(updated);
  } catch (err) {
    console.error("updateResult error", err);
    res.status(500).json({ error: "Failed to update result" });
  }
}
