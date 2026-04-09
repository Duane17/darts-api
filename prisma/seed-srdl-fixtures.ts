/* eslint-disable no-console */
import { PrismaClient, FixtureStatus, FixtureType, League } from "@prisma/client";

// Typed rounds from your TS data file (recommended)
// If you prefer a JSON file instead, see the JSON import variant comment below.
import ROUNDS, { RoundDef, Pairing } from "./data/srdl_seed_rounds_all";

const prisma = new PrismaClient();

/**
 * Canonical season identifiers for SRDL 2025.
 * We keep the legacy text in `season` for backward compatibility with queries that still match on the string.
 */
const SEASON_YEAR = 2025 as const;
const LEAGUE: League = "SRDL";
const SEASON_ID = `${SEASON_YEAR}:${LEAGUE}`;
const SEASON_LEGACY = "2025 SRDL";

/** Slug helper */
const toSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Normalize any known spelling variants to the canonical team name used in DB */
function normalizeTeamName(name: string): string {
  const trimmed = name.trim();
  const map: Record<string, string> = {
    TEDZAN: "Tedzani",
    "NKULA BEES": "Nkula Bees",
    "WHITE EAGLES": "White Eagles",
    "MUBAS ICE": "MUBAS Ice",
    "MUBAS FALCONS": "MUBAS Falcons",
    "NTE ARROWS": "NTE Arrows",
    "MIGHTY ARROWS": "Mighty Arrows",
    "COBBE STINGERS": "Cobbe Stingers",
    KATIMBA: "Katimba",
    KAPICHIRA: "Kapichira",
    BSC: "BSC",
    BWB: "BWB",
    "NEWLANDS SOCIALS": "Newlands Socials",
    "MIE SPEARS": "MIE Spears",
    BYE: "BYE",
  };

  const u = trimmed.toUpperCase();
  if (map[u]) return map[u];
  return trimmed;
}

/**
 * 14:30 Africa/Blantyre equals 12:30Z.
 * This locks all kickoff times in UTC for consistent scheduling.
 */
function dayAt1430ZUTC(isoDateYMD: string) {
  return new Date(`${isoDateYMD}T12:30:00Z`);
}

/**
 * Ensure a team exists by name. Creates it if absent.
 * Adjust fields to match your Team model columns.
 */
async function ensureTeamByName(name: string) {
  const slug = toSlug(name);
  const existing = await prisma.team.findUnique({ where: { slug } });
  if (existing) return existing.id;

  const created = await prisma.team.create({
    data: {
      name,
      slug,
      // remove the fields below if they do not exist in your schema
      city: null,
      logoUrl: null,
      active: true,
    },
    select: { id: true },
  });
  return created.id;
}

/**
 * Create or update a bye fixture.
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
  console.log("Seeding SRDL fixtures from file...");

  // Guarantee this known missing team exists
  await ensureTeamByName("MIE Spears");

  // Normalize names in memory and collect team names
  const normalizedRounds: RoundDef[] = ROUNDS.map((r) => ({
    ...r,
    games: r.games.map((g) => {
      if (g.kind === "bye") {
        return { kind: "bye", team: normalizeTeamName(g.team) } as Pairing;
      }
      const home = normalizeTeamName(g.home);
      const away = normalizeTeamName(g.away);
      return g.score
        ? { kind: "match", home, away, score: { home: g.score.home, away: g.score.away } }
        : { kind: "match", home, away };
    }),
  }));

  const nameSet = new Set<string>();
  for (const round of normalizedRounds) {
    for (const g of round.games) {
      if (g.kind === "bye") nameSet.add(g.team);
      else {
        nameSet.add(g.home);
        nameSet.add(g.away);
      }
    }
  }
  // Do not attempt to create a literal BYE
  nameSet.delete("BYE");

  // Bulk find existing teams
  const slugs = Array.from(nameSet).map(toSlug);
  const teams = await prisma.team.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, name: true },
  });

  const idBySlug = new Map<string, string>(teams.map((t) => [t.slug, t.id]));

  // Backfill missing teams
  for (const name of nameSet) {
    const s = toSlug(name);
    if (!idBySlug.has(s)) {
      const id = await ensureTeamByName(name);
      idBySlug.set(s, id);
    }
  }

  let created = 0;
  let updated = 0;
  let resultsUpserted = 0;

  for (const round of normalizedRounds) {
    const kickoff = dayAt1430ZUTC(round.dateYMD);

    for (const g of round.games) {
      if (g.kind === "bye") {
        const homeId = idBySlug.get(toSlug(g.team));
        if (!homeId) continue;

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

      const homeId = idBySlug.get(toSlug(g.home));
      const awayId = idBySlug.get(toSlug(g.away));
      if (!homeId || !awayId) {
        // If desired, throw instead of skipping
        // throw new Error(`Missing team id for ${g.home} or ${g.away}`);
        continue;
      }

      const hasScore =
        !!g.score &&
        Number.isFinite(Number(g.score.home)) &&
        Number.isFinite(Number(g.score.away));
      const status: FixtureStatus = hasScore ? FixtureStatus.PLAYED : FixtureStatus.SCHEDULED;

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

      if (hasScore && g.score) {
        await prisma.$transaction([
          prisma.result.upsert({
            where: { fixtureId: fx.id },
            update: { homeScore: g.score.home, awayScore: g.score.away },
            create: { fixtureId: fx.id, homeScore: g.score.home, awayScore: g.score.away },
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

/**
 * JSON import variant:
 * If you exported to JSON instead of TS, enable `resolveJsonModule` in tsconfig and do:
 *
 *   import roundsJson from "./data/srdl_seed_rounds_all.json";
 *   const ROUNDS: RoundDef[] = roundsJson as RoundDef[];
 *
 * Keep the rest of the file the same.
 */
