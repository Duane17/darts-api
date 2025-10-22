import { PrismaClient } from "@prisma/client";
import { computeTeamStanding } from "./standings";

/**
 * Create a result for a fixture, flip fixture to PLAYED, and recompute both teams' standings.
 * All changes apply atomically inside a transaction.
 */
export async function createResultAndUpdateTables(prisma: PrismaClient, args: {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const fixture = await tx.fixture.findUnique({
      where: { id: args.fixtureId },
      select: {
        id: true,
        season: true,
        status: true,
        isBye: true,
        homeTeamId: true,
        awayTeamId: true,
      },
    });

    if (!fixture) throw new Error("Fixture not found");
    if (fixture.isBye) throw new Error("Cannot record a result for a bye");
    if (!fixture.homeTeamId || !fixture.awayTeamId)
      throw new Error("Fixture teams are not set");
    if (fixture.status === "PLAYED") {
      // guard against duplicate create when it is already played
      const existing = await tx.result.findUnique({ where: { fixtureId: fixture.id } });
      if (existing) return existing;
    }

    // Make or replace the one to one result
    // If someone created a result earlier but forgot to flip status, we upsert defensively
    const result = await tx.result.upsert({
      where: { fixtureId: args.fixtureId },
      update: {
        homeScore: args.homeScore,
        awayScore: args.awayScore,
        notes: args.notes,
      },
      create: {
        fixtureId: args.fixtureId,
        homeScore: args.homeScore,
        awayScore: args.awayScore,
        notes: args.notes,
      },
    });

    // Flip fixture to played
    await tx.fixture.update({
      where: { id: fixture.id },
      data: { status: "PLAYED", kickoffTBA: false },
    });

    // Recompute standings for both teams
    await computeTeamStanding(tx, fixture.season, fixture.homeTeamId);
    await computeTeamStanding(tx, fixture.season, fixture.awayTeamId);

    return result;
  });
}

/**
 * Update an existing result by id, then recompute the two teams involved.
 */
export async function updateResultAndRecompute(prisma: PrismaClient, args: {
  resultId: string;
  homeScore?: number;
  awayScore?: number;
  notes?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    // Find result with its fixture and team info
    const existing = await tx.result.findUnique({
      where: { id: args.resultId },
      include: {
        fixture: {
          select: {
            id: true,
            season: true,
            homeTeamId: true,
            awayTeamId: true,
          },
        },
      },
    });
    if (!existing) throw new Error("Result not found");

    const result = await tx.result.update({
      where: { id: args.resultId },
      data: {
        homeScore: args.homeScore ?? existing.homeScore,
        awayScore: args.awayScore ?? existing.awayScore,
        notes: args.notes === undefined ? existing.notes : args.notes,
      },
    });

    await computeTeamStanding(tx, existing.fixture.season, existing.fixture.homeTeamId);
    if (existing.fixture.awayTeamId) {
      await computeTeamStanding(tx, existing.fixture.season, existing.fixture.awayTeamId);
    }

    return result;
  });
}
