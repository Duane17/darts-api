import { Prisma, PrismaClient } from "@prisma/client";

/** Create a leader */
export async function createLeader(
  prisma: PrismaClient,
  input: {
    slug: string;
    name: string;
    title: string;
    photo?: string;
    tagline?: string;
    profile?: string;
    email?: string;
    phone?: string;
    location?: string;
    bio?: string;
    responsibilities?: string[];
    achievements?: string[];
    education?: string[];
    leadershipSkills?: string[];
    professionalBackground?: string;
    sportingJourney?: string;
    term?: string;
    socials?: unknown; // zod validated upstream, stored as JSON
    active?: boolean;
  }
) {
  return prisma.leader.create({
    data: {
      slug: input.slug,
      name: input.name,
      title: input.title,
      photo: input.photo,
      tagline: input.tagline,
      profile: input.profile,
      email: input.email,
      phone: input.phone,
      location: input.location,
      bio: input.bio,
      responsibilities: input.responsibilities ?? [],
      achievements: input.achievements ?? [],
      education: input.education ?? [],
      leadershipSkills: input.leadershipSkills ?? [],
      professionalBackground: input.professionalBackground,
      sportingJourney: input.sportingJourney,
      term: input.term,
      // at create time you can pass undefined or a proper JSON value
      socials: input.socials as Prisma.InputJsonValue | undefined,
      active: input.active ?? true,
    },
  });
}

/** Update a leader */
export async function updateLeader(
  prisma: PrismaClient,
  id: string,
  input: {
    slug?: string;
    name?: string;
    title?: string;
    photo?: string | null;
    tagline?: string | null;
    profile?: string | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    bio?: string | null;

    responsibilities?: string[] | null;
    achievements?: string[] | null;
    education?: string[] | null;
    leadershipSkills?: string[] | null;

    professionalBackground?: string | null;
    sportingJourney?: string | null;
    term?: string | null;

    socials?: unknown | null; // allow clearing
    active?: boolean;
  }
) {
  const data: Prisma.LeaderUpdateInput = {};

  if (input.slug !== undefined) data.slug = input.slug;
  if (input.name !== undefined) data.name = input.name;
  if (input.title !== undefined) data.title = input.title;

  if (input.photo !== undefined) data.photo = input.photo;
  if (input.tagline !== undefined) data.tagline = input.tagline;
  if (input.profile !== undefined) data.profile = input.profile;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.location !== undefined) data.location = input.location;
  if (input.bio !== undefined) data.bio = input.bio;

  if (input.responsibilities !== undefined) data.responsibilities = input.responsibilities ?? [];
  if (input.achievements !== undefined) data.achievements = input.achievements ?? [];
  if (input.education !== undefined) data.education = input.education ?? [];
  if (input.leadershipSkills !== undefined) data.leadershipSkills = input.leadershipSkills ?? [];

  if (input.professionalBackground !== undefined) data.professionalBackground = input.professionalBackground;
  if (input.sportingJourney !== undefined) data.sportingJourney = input.sportingJourney;
  if (input.term !== undefined) data.term = input.term;

  // Handle nullable JSON correctly
  if (input.socials !== undefined) {
    const DbNull = (Prisma as any).DbNull ?? Prisma.NullTypes.DbNull;     // SQL NULL
    const JsonNull = (Prisma as any).JsonNull ?? Prisma.NullTypes.JsonNull; // JSON null

    if (input.socials === null) {
      data.socials = DbNull; // set column to SQL NULL
    } else if (input.socials === undefined) {
      // leave unchanged
    } else if (input.socials === null) {
      data.socials = DbNull;
    } else {
      // If you ever want to store JSON null as a value, use JsonNull instead:
      // data.socials = JsonNull;
      data.socials = input.socials as Prisma.InputJsonValue;
    }
  }

  if (input.active !== undefined) data.active = input.active;

  return prisma.leader.update({ where: { id }, data });
}

/** Soft delete by toggling active=false. If hard=true, delete row. */
export async function removeLeader(prisma: PrismaClient, id: string, hard = false) {
  if (hard) return prisma.leader.delete({ where: { id } });
  return prisma.leader.update({ where: { id }, data: { active: false } });
}
