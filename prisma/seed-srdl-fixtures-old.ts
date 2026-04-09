/* eslint-disable no-console */
import { PrismaClient, FixtureStatus, FixtureType, League } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Canonical season identifiers for SRDL 2025.
 * We keep the legacy text in `season` for backward compatibility with
 * any existing unique constraints and queries that still match on the string.
 */
const SEASON_YEAR = 2025 as const;
const LEAGUE: League = "SRDL";
const SEASON_ID = `${SEASON_YEAR}:${LEAGUE}`;
const SEASON_LEGACY = "2025 SRDL";

/** Small helper to make predictable slugs from names */
const toSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * 14:30 Africa/Blantyre equals 12:30Z. This locks all kickoff times for the day
 * in UTC for consistent scheduling and equality checks.
 */
function dayAt1430ZUTC(isoDateYMD: string) {
  return new Date(`${isoDateYMD}T12:30:00Z`);
}

/** Domain for describing the round fixtures */
type Pairing =
  | { kind: "match"; home: string; away: string; score?: { home: number; away: number } }
  | { kind: "bye"; team: string };

type RoundDef = {
  label: "A10" | "B10" | "A11" | "B11" | "A12" | "B12" | "A13" | "B13" | "A14" | "B14";
  group: "A" | "B";
  week: 10 | 11 | 12 | 13 | 14;
  dateYMD: string; // YYYY-MM-DD
  games: Pairing[];
};

/**
 * Data copied from your SRDL rounds.
 * Scores included where they are known so we can upsert Result rows too.
 */
const ROUNDS: RoundDef[] = [
  // 11 Oct 2025
  {
    label: "A10",
    group: "A",
    week: 10,
    dateYMD: "2025-10-11",
    games: [
      { kind: "bye", team: "BWB" },
      { kind: "match", home: "BSC", away: "Nkula Bees" },
      { kind: "match", home: "Katimba", away: "White Eagles" },
      { kind: "match", home: "Cobbe Stingers", away: "Kapichira" },
    ],
  },
  {
    label: "B10",
    group: "B",
    week: 10,
    dateYMD: "2025-10-11",
    games: [
      { kind: "match", home: "MUBAS Ice", away: "Mighty Arrows" },
      { kind: "match", home: "MUBAS Falcons", away: "Tedzani", score: { home: 17, away: 19 } },
      { kind: "match", home: "Newlands Socials", away: "NTE Arrows" },
    ],
  },
  // 18 Oct 2025
  {
    label: "A11",
    group: "A",
    week: 11,
    dateYMD: "2025-10-18",
    games: [
      { kind: "bye", team: "Kapichira" },
      { kind: "match", home: "White Eagles", away: "Cobbe Stingers" },
      { kind: "match", home: "Nkula Bees", away: "Katimba" },
      { kind: "match", home: "BWB", away: "BSC" },
    ],
  },
  {
    label: "B11",
    group: "B",
    week: 11,
    dateYMD: "2025-10-18",
    games: [
      { kind: "bye", team: "NTE Arrows" },
      { kind: "match", home: "Tedzani", away: "Newlands Socials" },
      { kind: "match", home: "Mighty Arrows", away: "MUBAS Ice" },
    ],
  },
  // 1 Nov 2025
  {
    label: "A12",
    group: "A",
    week: 12,
    dateYMD: "2025-11-01",
    games: [
      { kind: "bye", team: "BSC" },
      { kind: "match", home: "Katimba", away: "BWB" },
      { kind: "match", home: "Cobbe Stingers", away: "Nkula Bees" },
      { kind: "match", home: "Kapichira", away: "White Eagles" },
    ],
  },
  {
    label: "B12",
    group: "B",
    week: 12,
    dateYMD: "2025-11-01",
    games: [
      { kind: "bye", team: "MUBAS Ice" },
      { kind: "match", home: "MUBAS Falcons", away: "Mighty Arrows", score: { home: 19, away: 0 } },
      { kind: "match", home: "NTE Arrows", away: "Tedzani" },
    ],
  },
  // 8 Nov 2025
  {
    label: "A13",
    group: "A",
    week: 13,
    dateYMD: "2025-11-08",
    games: [
      { kind: "bye", team: "White Eagles" },
      { kind: "match", home: "Nkula Bees", away: "Kapichira" },
      { kind: "match", home: "BWB", away: "Cobbe Stingers" },
      { kind: "match", home: "BSC", away: "Katimba" },
    ],
  },
  {
    label: "B13",
    group: "B",
    week: 13,
    dateYMD: "2025-11-08",
    games: [
      { kind: "bye", team: "Tedzani" },
      { kind: "match", home: "MUBAS Ice", away: "NTE Arrows" },
      { kind: "match", home: "Mighty Arrows", away: "Newlands Socials" },
    ],
  },
  // 15 Nov 2025
  {
    label: "A14",
    group: "A",
    week: 14,
    dateYMD: "2025-11-15",
    games: [
      { kind: "bye", team: "Katimba" },
      { kind: "match", home: "Cobbe Stingers", away: "BSC" },
      { kind: "match", home: "Kapichira", away: "BWB" },
      { kind: "match", home: "White Eagles", away: "Nkula Bees" },
    ],
  },
  {
    label: "B14",
    group: "B",
    week: 14,
    dateYMD: "2025-11-15",
    games: [
      { kind: "bye", team: "MUBAS Falcons" },
      { kind: "match", home: "Newlands Socials", away: "MUBAS Ice" },
      { kind: "match", home: "NTE Arrows", away: "Mighty Arrows" },
    ],
  },
];

/**
 * Create or update a bye fixture.
 * We cannot use the compound unique on byes since `awayTeamId` is null, so we do a find first.
 * All new season keys are set together with the legacy `season`.
 */
async function ensureByeFixture(params: {
  teamId: string;
  title: string;
  description: string;
  date: Date;
  week: number;
}) {
  const { teamId, title, description, date, week } = params;

  const existing = await prisma.fixture.findFirst({
    where: {
      season: SEASON_LEGACY,
      date,
      homeTeamId: teamId,
      awayTeamId: null,
      isBye: true,
      league: LEAGUE,
      seasonYear: SEASON_YEAR,
      seasonId: SEASON_ID,
      type: FixtureType.SRDL_LEAGUE,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.fixture.update({
      where: { id: existing.id },
      data: {
        week,
        title,
        venue: "N/A",
        city: null,
        description,
        venueTBA: true,
        kickoffTBA: false,
        status: FixtureStatus.SCHEDULED,
      },
    });
    return existing.id;
  }

  const created = await prisma.fixture.create({
    data: {
      season: SEASON_LEGACY,
      seasonYear: SEASON_YEAR,
      league: LEAGUE,
      seasonId: SEASON_ID,

      week,
      title,
      date,
      type: FixtureType.SRDL_LEAGUE,
      venue: "N/A",
      city: null,
      description,
      venueTBA: true,
      kickoffTBA: false,
      status: FixtureStatus.SCHEDULED,
      isBye: true,
      homeTeam: { connect: { id: teamId } },
    },
    select: { id: true },
  });

  return created.id;
}

async function main() {
  console.log("Seeding SRDL fixtures A10 to B14...");

  // Build a name to id map for all team names referenced in the rounds
  const names = new Set<string>();
  for (const round of ROUNDS) {
    for (const g of round.games) {
      if (g.kind === "match") {
        names.add(g.home);
        names.add(g.away);
      } else {
        names.add(g.team);
      }
    }
  }

  const slugs = Array.from(names).map(toSlug);
  const teams = await prisma.team.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, name: true },
  });

  const idByName = new Map<string, string>();
  for (const t of teams) idByName.set(t.name, t.id);

  const missing = Array.from(names).filter((n) => !idByName.has(n));
  if (missing.length > 0) {
    throw new Error(
      "Missing Team rows for SRDL fixture seed. Seed teams first. Missing: " +
        JSON.stringify(missing, null, 2)
    );
  }

  let created = 0;
  let updated = 0;
  let resultsUpserted = 0;

  for (const round of ROUNDS) {
    const kickoff = dayAt1430ZUTC(round.dateYMD);

    for (const g of round.games) {
      if (g.kind === "bye") {
        const homeId = idByName.get(g.team)!;

        const before = await prisma.fixture.findFirst({
          where: {
            season: SEASON_LEGACY,
            date: kickoff,
            homeTeamId: homeId,
            awayTeamId: null,
            isBye: true,
          },
          select: { id: true, createdAt: true, updatedAt: true },
        });

        await ensureByeFixture({
          teamId: homeId,
          title: `${g.team} Bye`,
          description: `${g.team} has a bye`,
          date: kickoff,
          week: round.week,
        });

        if (before) updated += 1;
        else created += 1;

        continue;
      }

      // Normal match upsert uses the compound unique on (season, date, homeTeamId, awayTeamId)
      const homeId = idByName.get(g.home)!;
      const awayId = idByName.get(g.away)!;
      const status: FixtureStatus = g.score ? FixtureStatus.PLAYED : FixtureStatus.SCHEDULED;

      const fx = await prisma.fixture.upsert({
        where: {
          season_date_homeTeamId_awayTeamId: {
            season: SEASON_LEGACY,
            date: kickoff,
            homeTeamId: homeId,
            awayTeamId: awayId,
          },
        },
        update: {
          // Keep season keys in sync on update as well
          seasonYear: SEASON_YEAR,
          league: LEAGUE,
          seasonId: SEASON_ID,

          week: round.week,
          title: `${g.home} vs ${g.away}`,
          type: FixtureType.SRDL_LEAGUE,
          venue: "TBA",
          city: null,
          description: `SRDL ${round.label}`,
          venueTBA: true,
          kickoffTBA: false,
          status,
          isBye: false,
        },
        create: {
          season: SEASON_LEGACY,
          seasonYear: SEASON_YEAR,
          league: LEAGUE,
          seasonId: SEASON_ID,

          week: round.week,
          title: `${g.home} vs ${g.away}`,
          date: kickoff,
          type: FixtureType.SRDL_LEAGUE,
          venue: "TBA",
          city: null,
          description: `SRDL ${round.label}`,
          venueTBA: true,
          kickoffTBA: false,
          status,
          isBye: false,
          homeTeam: { connect: { id: homeId } },
          awayTeam: { connect: { id: awayId } },
        },
        select: { id: true, createdAt: true, updatedAt: true },
      });

      created += fx.createdAt.getTime() === fx.updatedAt.getTime() ? 1 : 0;
      updated += fx.createdAt.getTime() !== fx.updatedAt.getTime() ? 1 : 0;

      // If a score was provided, create or update the Result row and force PLAYED
      if (g.score) {
        await prisma.$transaction([
          prisma.result.upsert({
            where: { fixtureId: fx.id },
            update: {
              homeScore: g.score.home,
              awayScore: g.score.away,
            },
            create: {
              fixtureId: fx.id,
              homeScore: g.score.home,
              awayScore: g.score.away,
            },
          }),
          prisma.fixture.update({
            where: { id: fx.id },
            data: { status: FixtureStatus.PLAYED },
          }),
        ]);
        resultsUpserted += 1;
      }
    }
  }

  console.log(
    `SRDL fixtures seed complete. Fixtures created: ${created}, updated: ${updated}, results upserted: ${resultsUpserted}.`
  );
}

main()
  .catch((e) => {
    console.error("Seed SRDL fixtures failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
