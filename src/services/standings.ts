import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Compute a single team's standing for a season from results.
 * This is pure logic with DB access encapsulated, easy to unit test by mocking prisma.
 */
export async function computeTeamStanding(
  prisma: PrismaClient | Prisma.TransactionClient,
  season: string,
  teamId: string
) {
  // Pull all played fixtures for this team in the season with their results
  const results = await prisma.result.findMany({
    where: {
      fixture: {
        season,
        status: "PLAYED",
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
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

  let played = 0;
  let won = 0;
  let drawn = 0;
  let lost = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  const lastSymbols: string[] = [];

  for (const r of results) {
    const isHome = r.fixture.homeTeamId === teamId;
    const gf = isHome ? r.homeScore : r.awayScore;
    const ga = isHome ? r.awayScore : r.homeScore;

    played += 1;
    goalsFor += gf;
    goalsAgainst += ga;

    if (gf > ga) {
      won += 1;
      lastSymbols.push("W");
    } else if (gf === ga) {
      drawn += 1;
      lastSymbols.push("D");
    } else {
      lost += 1;
      lastSymbols.push("L");
    }
  }

  const goalDiff = goalsFor - goalsAgainst;
  const points = won * 3 + drawn * 1;

  const last5 = lastSymbols.slice(-5).join("");

  // Upsert single standing row for team in season
  await prisma.standing.upsert({
    where: { season_teamId: { season, teamId } },
    update: {
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDiff,
      points,
      last5: lastSymbols.length ? last5 : null,
    },
    create: {
      season,
      teamId,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDiff,
      points,
      last5: lastSymbols.length ? last5 : null,
    },
  });
}

/**
 * Recompute standings for many teams, or all teams for a season if none provided.
 * Runs inside a single transaction for consistency.
 */
export async function recomputeStandings(
  prisma: PrismaClient,
  season: string,
  teamIds?: string[]
) {
  await prisma.$transaction(async (tx) => {
    const ids =
      teamIds && teamIds.length
        ? teamIds
        : (
            await tx.team.findMany({
              where: { active: true },
              select: { id: true },
            })
          ).map((t) => t.id);

    for (const id of ids) {
      await computeTeamStanding(tx, season, id);
    }
  });
}
