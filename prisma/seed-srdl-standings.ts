/* eslint-disable no-console */
import { PrismaClient, Prisma, League } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Canonical season identifiers for the SRDL snapshot.
 * We write both the legacy `season` and the new keys for forward compatibility.
 */
const SEASON_YEAR = 2025 as const;
const LEAGUE: League = "SRDL";
const SEASON_ID = `${SEASON_YEAR}:${LEAGUE}`;
const SEASON_LEGACY = "2025 SRDL";

/**
 * Group A standings from the SRDL PDF.
 * The numbers are written directly to the Standing rows.
 */
const SRDL_GROUP_A = [
  { name: "Cobbe Stingers", played: 7, won: 7, drawn: 0, lost: 0, goalsFor: 172, goalsAgainst: 80,  goalDiff: 92,  points: 21 },
  { name: "White Eagles",   played: 8, won: 7, drawn: 0, lost: 1, goalsFor: 175, goalsAgainst: 113, goalDiff: 62,  points: 21 },
  { name: "Kapichira",      played: 8, won: 5, drawn: 0, lost: 3, goalsFor: 162, goalsAgainst: 126, goalDiff: 36,  points: 15 },
  { name: "BSC",            played: 8, won: 3, drawn: 1, lost: 4, goalsFor: 149, goalsAgainst: 139, goalDiff: 10,  points: 10 },
  { name: "Nkula Bees",     played: 7, won: 2, drawn: 1, lost: 4, goalsFor: 119, goalsAgainst: 133, goalDiff: -14, points: 7 },
  { name: "Katimba",        played: 8, won: 1, drawn: 1, lost: 6, goalsFor: 109, goalsAgainst: 179, goalDiff: -70, points: 4 },
  { name: "BWB",            played: 8, won: 0, drawn: 1, lost: 7, goalsFor: 86,  goalsAgainst: 202, goalDiff: -116, points: 1 },
] as const;

/**
 * Group B standings from the SRDL PDF.
 */
const SRDL_GROUP_B = [
  { name: "MUBAS Ice",        played: 7, won: 7, drawn: 0, lost: 0, goalsFor: 165, goalsAgainst: 87,  goalDiff: 78,  points: 21 },
  { name: "Mighty Arrows",    played: 8, won: 5, drawn: 0, lost: 3, goalsFor: 151, goalsAgainst: 120, goalDiff: 31,  points: 15 },
  { name: "NTE Arrows",       played: 7, won: 4, drawn: 0, lost: 3, goalsFor: 110, goalsAgainst: 106, goalDiff: 4,   points: 12 },
  { name: "Tedzani",          played: 8, won: 3, drawn: 0, lost: 5, goalsFor: 119, goalsAgainst: 169, goalDiff: -50, points: 9  },
  { name: "Newlands Socials", played: 7, won: 2, drawn: 1, lost: 4, goalsFor: 99,  goalsAgainst: 117, goalDiff: -18, points: 7  },
  { name: "MUBAS Falcons",    played: 9, won: 1, drawn: 1, lost: 7, goalsFor: 131, goalsAgainst: 176, goalDiff: -45, points: 4  },
] as const;

/** Same slug helper used elsewhere so names match Team rows */
function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  console.log(`Seeding SRDL standings snapshot for "${SEASON_LEGACY}"...`);

  // Load Team ids for all referenced names
  const neededNames = [...SRDL_GROUP_A.map((t) => t.name), ...SRDL_GROUP_B.map((t) => t.name)];
  const neededSlugs = neededNames.map(toSlug);

  const teams = await prisma.team.findMany({
    where: { slug: { in: neededSlugs } },
    select: { id: true, name: true, slug: true },
  });

  const teamIdByName = new Map<string, string>();
  for (const t of teams) teamIdByName.set(t.name, t.id);

  const missing = neededNames.filter((n) => !teamIdByName.has(n));
  if (missing.length > 0) {
    throw new Error(
      "Missing Team rows for SRDL standings seed. Please seed teams first. Missing: " +
        JSON.stringify(missing, null, 2)
    );
  }

  // Build a batch of upserts so it is atomic and idempotent.
  // Explicitly type as an array of Prisma promises to match the array overload.
  const ops: Prisma.PrismaPromise<unknown>[] = [];

  // Group A
  for (const row of SRDL_GROUP_A) {
    const teamId = teamIdByName.get(row.name)!;
    ops.push(
      prisma.standing.upsert({
        where: { season_teamId: { season: SEASON_LEGACY, teamId } },
        update: {
          // keep season keys in sync
          seasonYear: SEASON_YEAR,
          league: LEAGUE,
          seasonId: SEASON_ID,

          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDiff: row.goalDiff,
          points: row.points,
          group: "A",
        },
        create: {
          season: SEASON_LEGACY,
          seasonYear: SEASON_YEAR,
          league: LEAGUE,
          seasonId: SEASON_ID,

          teamId,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDiff: row.goalDiff,
          points: row.points,
          group: "A",
        },
      })
    );
  }

  // Group B
  for (const row of SRDL_GROUP_B) {
    const teamId = teamIdByName.get(row.name)!;
    ops.push(
      prisma.standing.upsert({
        where: { season_teamId: { season: SEASON_LEGACY, teamId } },
        update: {
          seasonYear: SEASON_YEAR,
          league: LEAGUE,
          seasonId: SEASON_ID,

          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDiff: row.goalDiff,
          points: row.points,
          group: "B",
        },
        create: {
          season: SEASON_LEGACY,
          seasonYear: SEASON_YEAR,
          league: LEAGUE,
          seasonId: SEASON_ID,

          teamId,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDiff: row.goalDiff,
          points: row.points,
          group: "B",
        },
      })
    );
  }

  // Only run a transaction if there is something to do
  if (ops.length > 0) {
    await prisma.$transaction(ops);
  }

  console.log(
    `SRDL standings seed complete. Inserted or updated ${ops.length} rows for "${SEASON_LEGACY}".`
  );
}

main()
  .catch((e) => {
    console.error("Seed SRDL standings failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
