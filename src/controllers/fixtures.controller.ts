import { Request, Response } from "express";
import { Prisma, PrismaClient, FixtureStatus, FixtureType } from "@prisma/client";

const prisma = new PrismaClient();

function parseBool(v: unknown): boolean | undefined {
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return undefined;
}

function parseIntOrUndef(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Map league query to a FixtureType when caller prefers league wording */
function coerceTypeFromLeague(league?: string): FixtureType | undefined {
  if (!league) return undefined;
  const key = league.trim().toLowerCase();

  // canonical league keys
  if (key === "srdl") return "SRDL_LEAGUE";
  if (key === "crdl") return "SMK_TRADING_CRDL";

  // tolerate data-source wording
  if (key.includes("smk") || key === "smk_trading_crdl") return "SMK_TRADING_CRDL";

  // "all" means no narrowing
  if (key === "all") return undefined;

  return undefined;
}


/** If time is missing, pin kickoff at 14:30 Africa/Blantyre which is 12:30Z */
function toKickoff(dateISO: string): Date {
  // If the string already contains a time, trust it
  if (/\dT\d/.test(dateISO)) return new Date(dateISO);
  // Append 12:30Z to represent 14:30 CAT
  return new Date(`${dateISO}T12:30:00Z`);
}

/** GET /fixtures */
/** GET /fixtures */
export async function listFixtures(req: Request, res: Response) {
  try {
    const {
      season,
      type,
      league,
      group,
      week,
      weekFrom,
      weekTo,
      status,
      teamId,
      playedOnly,
      includeResults,
      page,
      pageSize,
      from,
      to,
    } = req.query;

    const resolvedType =
      (type as FixtureType) || coerceTypeFromLeague(league as string);

    // Parse date window if provided
    const fromDate = typeof from === "string" && from ? new Date(from) : undefined;
    const toDate = typeof to === "string" && to ? new Date(to) : undefined;

    const where: Prisma.FixtureWhereInput = {
      ...(season ? { season: String(season) } : {}),
      ...(resolvedType ? { type: resolvedType } : {}),
      ...(status ? { status: status as FixtureStatus } : {}),
      ...(parseBool(playedOnly) ? { status: "PLAYED" } : {}),
      ...(group
        ? {
            OR: [
              {
                homeTeam: {
                  standings: {
                    some: {
                      season: String(season ?? ""),
                      group: String(group),
                    },
                  },
                },
              },
              {
                awayTeam: {
                  standings: {
                    some: {
                      season: String(season ?? ""),
                      group: String(group),
                    },
                  },
                },
              },
            ],
          }
        : {}),
      ...(teamId
        ? { OR: [{ homeTeamId: String(teamId) }, { awayTeamId: String(teamId) }] }
        : {}),
      ...(week ? { week: Number(week) } : {}),
      ...(weekFrom || weekTo
        ? {
            week: {
              ...(weekFrom ? { gte: Number(weekFrom) } : {}),
              ...(weekTo ? { lte: Number(weekTo) } : {}),
            },
          }
        : {}),
      // new: constrain by date if from/to are present
      ...(fromDate || toDate
        ? {
            date: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    };

    const take = parseIntOrUndef(pageSize) ?? 100;
    const p = parseIntOrUndef(page) ?? 1;
    const skip = take ? (p - 1) * take : 0;

    const [items, total] = await Promise.all([
      prisma.fixture.findMany({
        where,
        orderBy: [{ week: "asc" }, { date: "asc" }],
        include: {
          homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          ...(parseBool(includeResults) ? { result: true } : {}),
        },
        skip,
        take,
      }),
      prisma.fixture.count({ where }),
    ]);

    res.json({
      total,
      page: p,
      pageSize: take,
      items,
    });
  } catch (err) {
    console.error("listFixtures error", err);
    res.status(500).json({ error: "Failed to list fixtures" });
  }
}


/** POST /fixtures */
export async function createFixtureHandler(req: Request, res: Response) {
  try {
    const {
      season,
      week,
      title,
      date, // ISO date string, can be Y-M-D or full ISO
      type,
      venue,
      city,
      description,
      venueTBA,
      kickoffTBA,
      status,
      isBye,
      homeTeamId,
      awayTeamId,
    } = req.body as {
      season: string;
      week: number;
      title?: string;
      date: string;
      type: FixtureType;
      venue?: string;
      city?: string | null;
      description?: string | null;
      venueTBA?: boolean;
      kickoffTBA?: boolean;
      status?: FixtureStatus;
      isBye?: boolean;
      homeTeamId: string;
      awayTeamId?: string | null;
    };

    if (!season || !week || !date || !type || !homeTeamId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const kickoff = toKickoff(String(date));
    const bye = Boolean(isBye);

    if (bye) {
      // Enforce bye invariant
      const created = await prisma.fixture.create({
        data: {
          season,
          week,
          title: title ?? "Bye",
          date: kickoff,
          type,
          venue: venue ?? "N/A",
          city: city ?? null,
          description: description ?? `${homeTeamId} bye`,
          venueTBA: venueTBA ?? true,
          kickoffTBA: kickoffTBA ?? false,
          status: status ?? "SCHEDULED",
          isBye: true,
          homeTeam: { connect: { id: homeTeamId } },
          // awayTeamId stays null for bye
        },
        include: {
          homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        },
      });
      return res.status(201).json(created);
    }

    if (!awayTeamId) {
      return res
        .status(400)
        .json({ error: "awayTeamId is required for non bye fixtures" });
    }

    const created = await prisma.fixture.create({
      data: {
        season,
        week,
        title: title ?? "Fixture",
        date: kickoff,
        type,
        venue: venue ?? "TBA",
        city: city ?? null,
        description: description ?? null,
        venueTBA: venueTBA ?? true,
        kickoffTBA: kickoffTBA ?? false,
        status: status ?? "SCHEDULED",
        isBye: false,
        homeTeam: { connect: { id: homeTeamId } },
        awayTeam: { connect: { id: awayTeamId } },
      },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("createFixture error", err);
    res.status(500).json({ error: "Failed to create fixture" });
  }
}

/** PATCH /fixtures/:id */
export async function updateFixtureHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      season,
      week,
      title,
      date,
      type,
      venue,
      city,
      description,
      venueTBA,
      kickoffTBA,
      status,
      isBye,
      homeTeamId,
      awayTeamId,
    } = req.body as Partial<{
      season: string;
      week: number;
      title: string;
      date: string;
      type: FixtureType;
      venue: string;
      city: string | null;
      description: string | null;
      venueTBA: boolean;
      kickoffTBA: boolean;
      status: FixtureStatus;
      isBye: boolean;
      homeTeamId: string;
      awayTeamId: string | null;
    }>;

    const existing = await prisma.fixture.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const bye = isBye ?? existing.isBye;

    // Guard against illegal state changes
    if (bye && awayTeamId) {
      return res
        .status(400)
        .json({ error: "Bye fixture cannot have awayTeamId" });
    }

    const updated = await prisma.fixture.update({
      where: { id },
      data: {
        season,
        week,
        title,
        date: date ? toKickoff(date) : undefined,
        type,
        venue,
        city,
        description,
        venueTBA,
        kickoffTBA,
        status,
        isBye: bye,
        ...(homeTeamId ? { homeTeam: { connect: { id: homeTeamId } } } : {}),
        ...(bye
          ? { awayTeam: { disconnect: true } } // <- relational nulling
          : awayTeamId
          ? { awayTeam: { connect: { id: awayTeamId } } }
          : {}),
      },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        result: true,
      },
    });


    res.json(updated);
  } catch (err) {
    console.error("updateFixture error", err);
    res.status(500).json({ error: "Failed to update fixture" });
  }
}

/** DELETE /fixtures/:id */
export async function deleteFixtureHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.fixture.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("deleteFixture error", err);
    res.status(500).json({ error: "Failed to delete fixture" });
  }
}

/** Optional: GET /fixtures/:id */
export async function getFixtureById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const fx = await prisma.fixture.findUnique({
      where: { id },
      include: {
        homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        result: true,
      },
    });
    if (!fx) return res.status(404).json({ error: "Not found" });
    res.json(fx);
  } catch (err) {
    console.error("getFixtureById error", err);
    res.status(500).json({ error: "Failed to load fixture" });
  }
}
