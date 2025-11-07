/* eslint-disable no-console */
import { PrismaClient, League, FixtureType } from "@prisma/client";

const prisma = new PrismaClient();

// Set DRY_RUN=1 in env to preview changes without writing
const DRY_RUN = process.env.DRY_RUN === "1";
const CHUNK = 250;

/** Parse a loose season string. Accepts "2025 SRDL", "SRDL 2025", "2025 CRDL", "2025 SMK Trading CRDL", "2025". */
function parseSeasonLoose(s?: string): { year?: number; league?: League } {
  if (!s) return {};
  const lower = s.toLowerCase();

  // year
  const y = s.match(/\b(19\d{2}|20\d{2})\b/);
  const year = y ? Number(y[1]) : undefined;

  // league
  let league: League | undefined;
  if (/\bsrdl\b/.test(lower)) league = "SRDL";
  else if (/\bcrdl\b/.test(lower) || /\bsmk\b/.test(lower)) league = "CRDL";

  return { year, league };
}

function seasonIdOf(year: number, league: League) {
  return `${year}:${league}`;
}

function leagueFromType(t?: FixtureType | null): League | undefined {
  if (!t) return undefined;
  if (t === "SRDL_LEAGUE") return "SRDL";
  if (t === "SMK_TRADING_CRDL") return "CRDL";
  return undefined;
}

function pick<T>(...vals: Array<T | undefined | null>): T | undefined {
  for (const v of vals) if (v !== undefined && v !== null) return v as T;
  return undefined;
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

async function backfillFixtures() {
  const rows = await prisma.fixture.findMany({
    select: {
      id: true,
      season: true,
      seasonYear: true,
      league: true,
      seasonId: true,
      type: true,
      date: true,
    },
  });

  let touched = 0;
  let unchanged = 0;
  let skipped = 0;

  const updates: {
    id: string;
    seasonYear: number;
    league: League;
    seasonId: string;
  }[] = [];

  for (const f of rows) {
    // Already canonical
    if (f.seasonYear && f.league && f.seasonId) {
      unchanged++;
      continue;
    }

    const parsed = parseSeasonLoose(f.season || "");
    const yearFromDate = f.date ? new Date(f.date).getUTCFullYear() : undefined;

    const year = pick<number>(f.seasonYear ?? undefined, parsed.year, yearFromDate);
    const league = pick<League>(f.league ?? undefined, parsed.league, leagueFromType(f.type));

    if (!year || !league) {
      // Cannot infer unambiguously
      skipped++;
      continue;
    }

    const sid = seasonIdOf(year, league);

    // If already matches, ignore
    if (f.seasonYear === year && f.league === league && f.seasonId === sid) {
      unchanged++;
      continue;
    }

    updates.push({ id: f.id, seasonYear: year, league, seasonId: sid });
  }

  if (!DRY_RUN) {
    for (const group of chunk(updates, CHUNK)) {
      await prisma.$transaction(
        group.map((u) =>
          prisma.fixture.update({
            where: { id: u.id },
            data: { seasonYear: u.seasonYear, league: u.league, seasonId: u.seasonId },
          })
        )
      );
      touched += group.length;
    }
  } else {
    touched = updates.length;
  }

  return { scanned: rows.length, touched, unchanged, skipped };
}

async function backfillStandings() {
  // We will try:
  // 1) parse the legacy season string
  // 2) if league missing, look up any fixture for this team that now has seasonYear and league
  // 3) as a last resort, look up any fixture by year and team, then borrow league if unique
  const rows = await prisma.standing.findMany({
    select: {
      id: true,
      teamId: true,
      season: true,
      seasonYear: true,
      league: true,
      seasonId: true,
    },
  });

  let touched = 0;
  let unchanged = 0;
  let skipped = 0;

  const updates: {
    id: string;
    seasonYear: number;
    league: League;
    seasonId: string;
  }[] = [];

  for (const s of rows) {
    if (s.seasonYear && s.league && s.seasonId) {
      unchanged++;
      continue;
    }

    const parsed = parseSeasonLoose(s.season || "");
    let year = s.seasonYear ?? parsed.year;
    let league = s.league ?? parsed.league;

    // If league is still missing but we have year, try infer from fixtures of this team in that year
    if (year && !league) {
      const fxForTeamYear = await prisma.fixture.findMany({
        where: { seasonYear: year, OR: [{ homeTeamId: s.teamId }, { awayTeamId: s.teamId }] },
        select: { league: true },
        distinct: ["league"],
        take: 3,
      });
      const leagues = fxForTeamYear.map((r) => r.league).filter(Boolean) as League[];
      if (leagues.length === 1) league = leagues[0];
    }

    // If year is still missing but we can see fixtures, try to pick the most frequent year for this team
    if (!year) {
      const fxForTeam = await prisma.fixture.groupBy({
        by: ["seasonYear"],
        where: { OR: [{ homeTeamId: s.teamId }, { awayTeamId: s.teamId }] },
        _count: { _all: true },
      });
      const sorted = fxForTeam
        .filter((g) => g.seasonYear != null)
        .sort((a, b) => (b._count._all || 0) - (a._count._all || 0));
      if (sorted[0]?.seasonYear != null) {
        year = sorted[0].seasonYear!;
      }
    }

    if (!year || !league) {
      skipped++;
      continue;
    }

    const sid = seasonIdOf(year, league);

    if (s.seasonYear === year && s.league === league && s.seasonId === sid) {
      unchanged++;
      continue;
    }

    updates.push({ id: s.id, seasonYear: year, league, seasonId: sid });
  }

  if (!DRY_RUN) {
    for (const group of chunk(updates, CHUNK)) {
      await prisma.$transaction(
        group.map((u) =>
          prisma.standing.update({
            where: { id: u.id },
            data: { seasonYear: u.seasonYear, league: u.league, seasonId: u.seasonId },
          })
        )
      );
      touched += group.length;
    }
  } else {
    touched = updates.length;
  }

  return { scanned: rows.length, touched, unchanged, skipped };
}

async function main() {
  console.log("Backfill starting", { DRY_RUN });

  console.log("Step 1 of 2: fixtures");
  const fx = await backfillFixtures();
  console.log("Fixtures summary:", fx);

  console.log("Step 2 of 2: standings");
  const st = await backfillStandings();
  console.log("Standings summary:", st);

  if (DRY_RUN) {
    console.log("Dry run complete. Re-run without DRY_RUN=1 to persist.");
  } else {
    console.log("Backfill complete.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
