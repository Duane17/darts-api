import { z } from "zod";
import { FixtureStatus, FixtureType } from "@prisma/client";

export const CreateFixtureDto = z.object({
  season: z.string().min(1),
  week: z.number().int().min(1),
  title: z.string().min(3).max(160),
  date: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  type: z.nativeEnum(FixtureType).default("SMK_TRADING_CRDL"),
  venue: z.string().min(1).max(160),
  city: z.string().min(1).max(80).optional(),
  description: z.string().max(2000).optional(),
  venueTBA: z.boolean().optional().default(false),
  kickoffTBA: z.boolean().optional().default(false),
  isBye: z.boolean().optional().default(false),
  homeTeamId: z.uuid(),
  awayTeamId: z.uuid().nullable().optional(),
});

export type CreateFixtureDto = z.infer<typeof CreateFixtureDto>;

export const UpdateFixtureDto = z.object({
  season: z.string().min(1).optional(),
  week: z.number().int().min(1).optional(),
  title: z.string().min(3).max(160).optional(),
  date: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  type: z.nativeEnum(FixtureType).optional(),
  venue: z.string().min(1).max(160).optional(),
  city: z.string().min(1).max(80).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  venueTBA: z.boolean().optional(),
  kickoffTBA: z.boolean().optional(),
  status: z.nativeEnum(FixtureStatus).optional(),
  isBye: z.boolean().optional(),

  homeTeamId: z.string().uuid().optional(),
  awayTeamId: z.string().uuid().nullable().optional(),
});

export type UpdateFixtureDto = z.infer<typeof UpdateFixtureDto>;

export const ListFixturesQuery = z.object({
  season: z.string().min(1).optional(),
  teamId: z.string().uuid().optional(),
  status: z.nativeEnum(FixtureStatus).optional(),
  type: z.nativeEnum(FixtureType).optional(),
  week: z.coerce.number().int().min(1).optional(),
  weekFrom: z.coerce.number().int().min(1).optional(),
  weekTo: z.coerce.number().int().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  includeCanceled: z.coerce.boolean().optional().default(false),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["date_asc", "date_desc", "week_asc", "week_desc"]).default("date_asc"),
});
export type ListFixturesQuery = z.infer<typeof ListFixturesQuery>;
