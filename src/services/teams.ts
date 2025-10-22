import { Prisma, PrismaClient } from "@prisma/client";
import { toSlug } from "../lib/slug";

export async function createTeam(prisma: PrismaClient, input: {
  name: string;
  logoUrl?: string;
  city?: string;
  homeVenue?: string;
  homeCity?: string;
  active?: boolean;
}) {
  const slug = toSlug(input.name);
  return prisma.team.create({
    data: {
      name: input.name,
      slug,
      logoUrl: input.logoUrl,
      city: input.city,
      homeVenue: input.homeVenue,
      homeCity: input.homeCity,
      active: input.active ?? true,
    },
  });
}

export async function updateTeam(prisma: PrismaClient, id: string, input: {
  name?: string;
  logoUrl?: string;
  city?: string;
  homeVenue?: string;
  homeCity?: string;
  active?: boolean;
}) {
  const data: Prisma.TeamUpdateInput = {
    logoUrl: input.logoUrl,
    city: input.city,
    homeVenue: input.homeVenue,
    homeCity: input.homeCity,
    active: input.active,
  };
  if (input.name) {
    data.name = input.name;
    data.slug = toSlug(input.name);
  }
  return prisma.team.update({
    where: { id },
    data,
  });
}

/**
 * Soft delete semantics by default to avoid foreign key issues.
 * If you truly want to hard delete, pass hard=true.
 * Hard delete will fail if related fixtures exist.
 */
export async function removeTeam(prisma: PrismaClient, id: string, hard = false) {
  if (!hard) {
    return prisma.team.update({
      where: { id },
      data: { active: false },
    });
  }
  return prisma.team.delete({ where: { id } });
}
