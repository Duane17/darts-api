// src/dto/team.dto.ts
import { z } from "zod";

const OptionalStr = z
  .string()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const CreateTeamDto = z.object({
  name: z.string().min(2).max(80),
  logoUrl: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  city: OptionalStr,
  homeVenue: OptionalStr,
  homeCity: OptionalStr,
  active: z.coerce.boolean().optional(),
});
export type CreateTeamDto = z.infer<typeof CreateTeamDto>;

export const UpdateTeamDto = z.object({
  name: z.string().min(2).max(80).optional(),
  logoUrl: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  city: OptionalStr,
  homeVenue: OptionalStr,
  homeCity: OptionalStr,
  active: z.coerce.boolean().optional(),
});
export type UpdateTeamDto = z.infer<typeof UpdateTeamDto>;

export const ListTeamsQuery = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  active: z.coerce.boolean().optional(),
});
export type ListTeamsQuery = z.infer<typeof ListTeamsQuery>;
