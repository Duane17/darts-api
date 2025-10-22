/* prisma/seed.results.ts
   Seeds match results for a chosen season, then recomputes standings.
   Usage examples:
     pnpm ts-node prisma/seed.results.ts
     pnpm ts-node prisma/seed.results.ts --season=2025 --weekFrom=14 --weekTo=20
*/
import { PrismaClient, FixtureStatus, FixtureType } from "@prisma/client";

const prisma = new PrismaClient();

// CLI arg parsing without external deps
type CliArgs = {
  season: string;
  weekFrom?: number;
  weekTo?: number;
  limit?: number; // optional cap on number of fixtures to seed
};
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const kv: Record<string, string> = {};
  for (const a of args) {
    const [k, v] = a.replace(/^--/, "").split("=");
    if (k) kv[k] = v ?? "true";
  }
  return {
    season: kv.season ?? "2025",
    weekFrom: kv.weekFrom ? Number(kv.weekFrom) : undefined,
    weekTo: kv.weekTo ? Number(kv.weekTo) : undefined,
    limit: kv.limit ? Number(kv.limit) : undefined,
  };
}

/** Deterministic pseudo random from a string seed */
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Produce a stable score line for a fixture based on ids and date */
function makeScore(fixtureId: string, homeTeamId: string, awayTeamId: string | null, dateIso: string) {
  // If bye, always 0 0 and do not create a result
  if (!awayTeamId) return { isBye: true as const, home: 0, away: 0 };

  const seed = hashSeed(`${fixtureId}:${homeTeamId}:${awayTeamId}:${dateIso}`);
  // Small score range suitable for darts score placeholders or low scoring sports
  // You can adjust max if your sport tracks larger numbers
  const max = 10;
  const home = (seed % (max + 1)) | 0;
  const away = ((seed >>> 7) % (max + 1)) | 0;

  // Nudge to avoid excessive draws while keeping determinism
  if (home === away) {
    return { isBye: false as const, home: (home + (seed % 2 === 0 ? 1 : 0)) % (max + 1), away };
  }
  return { isBye: false as const, home, away };
}

/** Recompute standings for a season from Result + Fixture */
async function recomputeStandings(season: string) {
  // Pull all results for the season with the minimal fields required
  const results = await prisma.result.findMany({
    where: { fixture: { season } },
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

  const table = new Map<string, Tally>();
  function ensure(teamId: string) {
    if (!table.has(teamId)) {
      table.set(teamId, {
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
    return table.get(teamId)!;
  }

  for (const r of results) {
    const { fixtureId } = r;
    const f = r.fixture;
    if (!f.awayTeamId) continue; // skip byes just in case

    const home = ensure(f.homeTeamId);
    const away = ensure(f.awayTeamId);

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

  // Persist standings with points and goalDiff
  for (const t of table.values()) {
    const points = t.won * 3 + t.drawn * 1;
    const goalDiff = t.goalsFor - t.goalsAgainst;
    const last5 = t.lastOutcomes.slice(-5).join(",");

    await prisma.standing.upsert({
      where: { season_teamId: { season, teamId: t.teamId } },
      create: {
        season,
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

/** Seed a batch of fixtures into results and flip status to PLAYED */
async function seedResults(args: CliArgs) {
  const { season, weekFrom, weekTo, limit } = args;

  // Pull fixtures that do not yet have a result
  const fixtures = await prisma.fixture.findMany({
    where: {
      season,
      status: { in: [FixtureStatus.SCHEDULED, FixtureStatus.PLAYED] },
      isBye: false,
      result: null,
      awayTeamId: { not: null },
      type: { in: [FixtureType.SMK_TRADING_CRDL, FixtureType.FRIENDLY, FixtureType.TOURNAMENT] },
      ...(weekFrom || weekTo
        ? {
            week: {
              ...(weekFrom ? { gte: weekFrom } : {}),
              ...(weekTo ? { lte: weekTo } : {}),
            },
          }
        : {}),
    },
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
    console.log(`No seedable fixtures found for season ${season}.`);
    return { created: 0 };
  }

  let created = 0;

  for (const f of fixtures) {
    const score = makeScore(f.id, f.homeTeamId, f.awayTeamId, f.date.toISOString());
    if (score.isBye) continue;

    await prisma.$transaction(async (trx) => {
      // Create or upsert result in case of partial prior runs
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

      // Flip fixture status to PLAYED
      await trx.fixture.update({
        where: { id: f.id },
        data: { status: FixtureStatus.PLAYED },
      });
    });

    created += 1;
  }

  return { created };
}

async function main() {
  const args = parseArgs();

  console.log(`Seeding results for season ${args.season}...`);
  const { created } = await seedResults(args);
  console.log(`Created or updated results: ${created}`);

  console.log(`Recomputing standings for season ${args.season}...`);
  await recomputeStandings(args.season);
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
