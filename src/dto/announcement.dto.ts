import { z } from "zod";
import { AnnouncementPriority } from "@prisma/client";

export const ListAnnouncementsQuery = z.object({
  q: z.string().trim().optional(),
  priority: z.nativeEnum(AnnouncementPriority).optional(),
  activeOnly: z.coerce.boolean().optional().default(true), // excludes expired by default
  since: z.coerce.date().optional(),
  until: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});
export type ListAnnouncementsQuery = z.infer<typeof ListAnnouncementsQuery>;

export const CreateAnnouncementDto = z.object({
  title: z.string().min(3).max(160),
  body: z.string().min(1),
  priority: z.nativeEnum(AnnouncementPriority).optional().default("NORMAL"),
  publishedAt: z.coerce.date().optional(),   // default now in service
  expiresAt: z.coerce.date().nullable().optional(),
});
export type CreateAnnouncementDto = z.infer<typeof CreateAnnouncementDto>;

export const UpdateAnnouncementDto = z.object({
  title: z.string().min(3).max(160).optional(),
  body: z.string().min(1).optional(),
  priority: z.nativeEnum(AnnouncementPriority).optional(),
  publishedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
});
export type UpdateAnnouncementDto = z.infer<typeof UpdateAnnouncementDto>;
