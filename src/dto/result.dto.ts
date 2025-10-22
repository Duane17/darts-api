import { z } from "zod";

/** For creating a brand new result */
export const CreateResultDto = z.object({
  fixtureId: z.string().uuid(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  notes: z.string().max(2000).optional(),
});
export type CreateResultDto = z.infer<typeof CreateResultDto>;

/** For updating an existing result by result id */
export const UpdateResultDto = z.object({
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  notes: z.string().max(2000).nullable().optional(),
});
export type UpdateResultDto = z.infer<typeof UpdateResultDto>;

/** For standing recompute endpoint */
export const RecomputeStandingDto = z.object({
  season: z.string().min(1),
  teamIds: z.array(z.string().uuid()).optional(), // if omitted, recompute all
});
export type RecomputeStandingDto = z.infer<typeof RecomputeStandingDto>;


/** Query params for GET /results */
export const ListResultsQuery = z.object({
  season: z.string().min(1).optional(),
  teamId: z.string().uuid().optional(),          
  fixtureId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),              
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["date_asc", "date_desc", "created_asc", "created_desc"]).default("date_desc"),
});
export type ListResultsQuery = z.infer<typeof ListResultsQuery>;