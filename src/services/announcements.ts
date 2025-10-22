import { Prisma, PrismaClient, AnnouncementPriority } from "@prisma/client";

export async function createAnnouncement(
  prisma: PrismaClient,
  input: {
    title: string;
    body: string;
    priority?: AnnouncementPriority;
    publishedAt?: Date;
    expiresAt?: Date | null;
  }
) {
  const data: Prisma.AnnouncementUncheckedCreateInput = {
    title: input.title,
    body: input.body,
    priority: input.priority ?? "NORMAL",
    publishedAt: input.publishedAt ?? new Date(),
    expiresAt: input.expiresAt ?? null,
  };
  return prisma.announcement.create({ data });
}

export async function updateAnnouncement(
  prisma: PrismaClient,
  id: string,
  input: {
    title?: string;
    body?: string;
    priority?: AnnouncementPriority;
    publishedAt?: Date | null;   // caller may pass null by mistake; we will guard
    expiresAt?: Date | null;
  }
) {
  const data: Prisma.AnnouncementUncheckedUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.body !== undefined) data.body = input.body;
  if (input.priority !== undefined) data.priority = input.priority;

  // publishedAt is NOT nullable in the schema, so forbid null
  if (input.publishedAt !== undefined) {
    if (input.publishedAt === null) {
      throw new Error("publishedAt cannot be null");
    }
    data.publishedAt = input.publishedAt; // Date or string
  }

  // expiresAt IS nullable, so use the field operation form to allow null
  if (input.expiresAt !== undefined) {
    data.expiresAt = { set: input.expiresAt }; // Date or null
  }

  return prisma.announcement.update({ where: { id }, data });
}

export async function deleteAnnouncement(prisma: PrismaClient, id: string) {
  return prisma.announcement.delete({ where: { id } });
}
