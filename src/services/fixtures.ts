import { Prisma, PrismaClient } from "@prisma/client";

export async function createFixture(prisma: PrismaClient, input: {
  season: string;
  week: number;
  title: string;
  date: Date;
  endDate?: Date | null;
  type: Prisma.FixtureCreateInput["type"];
  venue: string;
  city?: string | null;
  description?: string | null;
  venueTBA?: boolean;
  kickoffTBA?: boolean;
  isBye?: boolean;
  homeTeamId: string;
  awayTeamId?: string | null;
}) {
  return prisma.fixture.create({
    data: {
      season: input.season,
      week: input.week,
      title: input.title,
      date: input.date,
      endDate: input.endDate ?? null,
      type: input.type,
      venue: input.venue,
      city: input.city ?? null,
      description: input.description ?? null,
      venueTBA: Boolean(input.venueTBA),
      kickoffTBA: Boolean(input.kickoffTBA),
      status: "SCHEDULED",
      isBye: Boolean(input.isBye),

      homeTeam: { connect: { id: input.homeTeamId } },
      ...(input.awayTeamId ? { awayTeam: { connect: { id: input.awayTeamId } } } : {}),
    },
  });
}

export async function updateFixture(prisma: PrismaClient, id: string, input: {
  season?: string;
  week?: number;
  title?: string;
  date?: Date;
  endDate?: Date | null;
  type?: Prisma.FixtureUpdateInput["type"];
  venue?: string;
  city?: string | null;
  description?: string | null;
  venueTBA?: boolean;
  kickoffTBA?: boolean;
  status?: Prisma.FixtureUpdateInput["status"];
  isBye?: boolean;
  homeTeamId?: string;
  awayTeamId?: string | null;
}) {
  const data: Prisma.FixtureUpdateInput = {
    season: input.season,
    week: input.week,
    title: input.title,
    date: input.date,
    endDate: input.endDate === undefined ? undefined : input.endDate,
    type: input.type,
    venue: input.venue,
    city: input.city === undefined ? undefined : input.city,
    description: input.description === undefined ? undefined : input.description,
    venueTBA: input.venueTBA,
    kickoffTBA: input.kickoffTBA,
    status: input.status,
    isBye: input.isBye,
  };

  if (input.homeTeamId) {
    data.homeTeam = { connect: { id: input.homeTeamId } };
  }
  if (input.awayTeamId !== undefined) {
    if (input.awayTeamId === null) data.awayTeam = { disconnect: true };
    else data.awayTeam = { connect: { id: input.awayTeamId } };
  }

  return prisma.fixture.update({
    where: { id },
    data,
  });
}

/**
 * Soft delete: mark as CANCELED. Listing endpoints hide CANCELED by default.
 */
export async function softDeleteFixture(prisma: PrismaClient, id: string) {
  return prisma.fixture.update({
    where: { id },
    data: { status: "CANCELED" },
  });
}
