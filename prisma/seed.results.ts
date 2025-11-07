/* prisma/seed.results.ts
   Seeds match results for a chosen season, then recomputes standings.

   Usage examples:
     pnpm ts-node prisma/seed.results.ts
     pnpm ts-node prisma/seed.results.ts --year=2025 --league=CRDL --weekFrom=14 --weekTo=20
     pnpm ts-node prisma/seed.results.ts --season=2025 --league=SRDL
*/
import { PrismaClient, FixtureStatus, FixtureType, League, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

/* -----------------------------
   CLI args and season targeting
   ----------------------------- */

type CliArgs = {
  season?: string;     // legacy input like "2025" or "2025 SRDL"
  year?: number;       // preferred: 2025
  league?: League;     // "SRDL" or "CRDL"
  weekFrom?: number;
  weekTo?: number;
  limit?: number;
};

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const kv: Record<string, string> = {};
  for (const a of args) {
    const [k0, v0] = a.replace(/^--/, "").split("=");
    if (k0) kv[k0] = v0 ?? "true";
  }
  const out: CliArgs = {};

  if (kv.season) out.season = kv.season;
  if (kv.year) out.year = Number(kv.year);
  if (kv.league) out.league = kv.league.toUpperCase() as League;
  if (kv.weekFrom) out.weekFrom = Number(kv.weekFrom);
  if (kv.weekTo) out.weekTo = Number(kv.weekTo);
  if (kv.limit) out.limit = Number(kv.limit);

  return out;
}

/** Parse a legacy season string like "2025" or "2025 SRDL" into parts */
function parseLegacySeasonString(season?: string): { year?: number; league?: League } {
  if (!season) return {};
  const y = season.match(/\b(20\d{2})\b/);
  const year = y ? Number(y[1]) : undefined;
  const s = season.toLowerCase();
  let league: League | undefined;
  if (/\bsrdl\b/.test(s)) league = "SRDL";
  if (/\bcrdl\b/.test(s) || /\bsmk\b/.test(s)) league = "CRDL";
  return { year, league };
}

/** Build the canonical season identifiers from inputs */
function resolveSeason(args: CliArgs): {
  seasonYear: number;
  league: League;
  seasonId: string;         // "YYYY:LEAGUE"
  seasonLegacyText: string; // "YYYY LEAGUE"
} {
  const legacy = parseLegacySeasonString(args.season);
  const seasonYear = args.year ?? legacy.year ?? 2025;
  const league = args.league ?? legacy.league ?? "CRDL";
  const seasonId = `${seasonYear}:${league}`;
  const seasonLegacyText = `${seasonYear} ${league}`;
  return { seasonYear, league, seasonId, seasonLegacyText };
}

/* -----------------------------
   Deterministic pseudo random
   ----------------------------- */

function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeScore(
  fixtureId: string,
  homeTeamId: string,
  awayTeamId: string | null,
  dateIso: string
) {
  if (!awayTeamId) return { isBye: true as const, home: 0, away: 0 };
  const seed = hashSeed(`${fixtureId}:${homeTeamId}:${awayTeamId}:${dateIso}`);
  const max = 10;
  const home = seed % (max + 1);
  const away = (seed >>> 7) % (max + 1);
  if (home === away) {
    return { isBye: false as const, home: (home + (seed % 2 === 0 ? 1 : 0)) % (max + 1), away };
  }
  return { isBye: false as const, home, away };
}

/* -----------------------------
   Standings recompute
   ----------------------------- */

type Tally = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  lastOutcomes: ("W" | "D" | "L")[];
};

function ensureTally(tbl: Map<string, Tally>, teamId: string) {
  if (!tbl.has(teamId)) {
    tbl.set(teamId, {
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      lastOutcomes: [],
    });
  }
  return tbl.get(teamId)!;
}

/**
 * Recompute standings for a given season target.
 * The target is matched by seasonId or by legacy season string to support mixed data during migrations.
 */
async function recomputeStandingsFor(
  seasonYear: number,
  league: League,
  seasonId: string,
  seasonLegacyText: string
) {
  const results = await prisma.result.findMany({
    where: {
      OR: [
        { fixture: { seasonId } },
        { fixture: { season: seasonLegacyText } },
        { fixture: { season: String(seasonYear) } },
        { fixture: { season: String(seasonYear) + " SRDL" } },
        { fixture: { season: String(seasonYear) + " CRDL" } },
      ],
    },
    include: {
      fixture: {
        select: {
          id: true,
          date: true,
          homeTeamId: true,
          awayTeamId: true,
        },
      },
    },
    orderBy: { fixture: { date: "asc" } },
  });

  const table = new Map<string, Tally>();

  for (const r of results) {
    const f = r.fixture;
    if (!f.awayTeamId) continue;

    const home = ensureTally(table, f.homeTeamId);
    const away = ensureTally(table, f.awayTeamId);

    home.played += 1;
    away.played += 1;

    home.goalsFor += r.homeScore;
    home.goalsAgainst += r.awayScore;

    away.goalsFor += r.awayScore;
    away.goalsAgainst += r.homeScore;

    if (r.homeScore > r.awayScore) {
      home.won += 1;
      away.lost += 1;
      home.lastOutcomes.push("W");
      away.lastOutcomes.push("L");
    } else if (r.homeScore < r.awayScore) {
      away.won += 1;
      home.lost += 1;
      home.lastOutcomes.push("L");
      away.lastOutcomes.push("W");
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.lastOutcomes.push("D");
      away.lastOutcomes.push("D");
    }
  }

  // Persist standings. We keep the existing unique compound on (season, teamId).
  for (const t of table.values()) {
    const points = t.won * 3 + t.drawn;
    const goalDiff = t.goalsFor - t.goalsAgainst;
    const last5 = t.lastOutcomes.slice(-5).join(",");

    await prisma.standing.upsert({
      where: { season_teamId: { season: seasonLegacyText, teamId: t.teamId } },
      create: {
        // legacy and new keys set together
        season: seasonLegacyText,
        seasonYear,
        league,
        seasonId,
        teamId: t.teamId,

        played: t.played,
        won: t.won,
        drawn: t.drawn,
        lost: t.lost,
        goalsFor: t.goalsFor,
        goalsAgainst: t.goalsAgainst,
        goalDiff,
        points,
        last5,
      },
      update: {
        // keep keys in sync in case they were missing before
        seasonYear,
        league,
        seasonId,

        played: t.played,
        won: t.won,
        drawn: t.drawn,
        lost: t.lost,
        goalsFor: t.goalsFor,
        goalsAgainst: t.goalsAgainst,
        goalDiff,
        points,
        last5,
      },
    });
  }
}

/* -----------------------------
   Result seeding
   ----------------------------- */

/**
 * Build a where clause that targets the correct season across both new and legacy fields.
 * Includes optional week range, type filter, and only fixtures without a result.
 */
function buildFixturesWhere(
  seasonYear: number,
  league: League,
  seasonId: string,
  seasonLegacyText: string,
  weekFrom?: number,
  weekTo?: number
): Prisma.FixtureWhereInput {
  const ors: Prisma.FixtureWhereInput[] = [
    { seasonId },
    { season: seasonLegacyText },
    { season: String(seasonYear) },
    { season: `${seasonYear} SRDL` },
    { season: `${seasonYear} CRDL` },
  ];

  const weekCond: Prisma.FixtureWhereInput | undefined =
    weekFrom || weekTo
      ? {
          week: {
            ...(typeof weekFrom === "number" ? { gte: weekFrom } : {}),
            ...(typeof weekTo === "number" ? { lte: weekTo } : {}),
          },
        }
      : undefined;

  const where: Prisma.FixtureWhereInput = {
    OR: ors,
    isBye: false,
    result: { is: null },
    awayTeamId: { not: null },
    type: { in: [FixtureType.SMK_TRADING_CRDL, FixtureType.FRIENDLY, FixtureType.TOURNAMENT] },
    ...(weekCond ?? {}),
  };

  return where;
}

async function seedResultsFor(
  seasonYear: number,
  league: League,
  seasonId: string,
  seasonLegacyText: string,
  weekFrom?: number,
  weekTo?: number,
  limit?: number
) {
  const where = buildFixturesWhere(seasonYear, league, seasonId, seasonLegacyText, weekFrom, weekTo);

  const fixtures = await prisma.fixture.findMany({
    where,
    orderBy: [{ week: "asc" }, { date: "asc" }],
    take: limit,
    select: {
      id: true,
      date: true,
      week: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });

  if (fixtures.length === 0) {
    console.log(`No seedable fixtures found for ${seasonLegacyText}.`);
    return { created: 0 };
  }

  let created = 0;

  for (const f of fixtures) {
    const score = makeScore(f.id, f.homeTeamId, f.awayTeamId, f.date.toISOString());
    if (score.isBye) continue;

    await prisma.$transaction(async (trx) => {
      await trx.result.upsert({
        where: { fixtureId: f.id },
        create: {
          fixtureId: f.id,
          homeScore: score.home,
          awayScore: score.away,
        },
        update: {
          homeScore: score.home,
          awayScore: score.away,
        },
      });

      await trx.fixture.update({
        where: { id: f.id },
        data: { status: FixtureStatus.PLAYED },
      });
    });

    created += 1;
  }

  return { created };
}

/* -----------------------------
   Main
   ----------------------------- */

async function main() {
  const args = parseArgs();
  const { seasonYear, league, seasonId, seasonLegacyText } = resolveSeason(args);

  console.log(
    `Seeding results for ${seasonLegacyText} (seasonId=${seasonId})` +
      (args.weekFrom || args.weekTo ? `, weeks ${args.weekFrom ?? "-"} to ${args.weekTo ?? "-"}` : "")
  );

  const { created } = await seedResultsFor(
    seasonYear,
    league,
    seasonId,
    seasonLegacyText,
    args.weekFrom,
    args.weekTo,
    args.limit
  );
  console.log(`Created or updated results: ${created}`);

  console.log(`Recomputing standings for ${seasonLegacyText}...`);
  await recomputeStandingsFor(seasonYear, league, seasonId, seasonLegacyText);
  console.log("Standings recomputed.");

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
