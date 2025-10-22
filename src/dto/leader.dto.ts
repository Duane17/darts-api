import { z } from "zod";

export const SocialLink = z.object({
  platform: z.enum(["facebook", "twitter", "instagram", "linkedin", "website"]),
  url: z.string().url(),
});
export type SocialLink = z.infer<typeof SocialLink>;

const StrArr = z.array(z.string().min(1)).default([]);


const PhotoUrl = z.union([
  z.string().url(),
  z.string().regex(/^\/uploads\//, "must be a /uploads/... path"),
]);


const StringOrStringArray = z.preprocess((v) => {
  if (v == null) return v;
  if (Array.isArray(v)) return v;
  if (typeof v === "string") return [v];
  return v;
}, z.array(z.string().min(1)));

export const ListLeadersQuery = z.object({
  q: z.string().trim().optional(),
  activeOnly: z.coerce.boolean().optional().default(true),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z
    .enum(["name_asc", "name_desc", "title_asc", "title_desc", "newest", "oldest"])
    .default("name_asc"),
});
export type ListLeadersQuery = z.infer<typeof ListLeadersQuery>;

export const CreateLeaderDto = z.object({
  slug: z.string().min(1),
  name: z.string().min(2).max(120),
  title: z.string().min(2).max(160),
  photo: PhotoUrl.optional(),
  tagline: z.string().max(200).optional(),
  profile: z.string().max(1000).optional(),
  bio: z.string().optional(),
  responsibilities: StringOrStringArray.optional(),
  achievements: StringOrStringArray.optional(),
  education: StringOrStringArray.optional(),
  leadershipSkills: StringOrStringArray.optional(),
  professionalBackground: z.string().optional(),
  sportingJourney: z.string().optional(),
  term: z.string().optional(),
  socials: z.array(SocialLink).optional(),
  active: z.coerce.boolean().optional().default(true),
});
export type CreateLeaderDto = z.infer<typeof CreateLeaderDto>;

export const UpdateLeaderDto = z.object({
  slug: z.string().min(1).optional(),
  name: z.string().min(2).max(120).optional(),
  title: z.string().min(2).max(160).optional(),
  photo: PhotoUrl.nullable().optional(),
  tagline: z.string().max(200).nullable().optional(),
  profile: z.string().max(1000).nullable().optional(),
  bio: z.string().nullable().optional(),
  responsibilities: z.preprocess((v) => (v === "" ? null : v), StringOrStringArray.nullable().optional()),
  achievements:    z.preprocess((v) => (v === "" ? null : v), StringOrStringArray.nullable().optional()),
  education:       z.preprocess((v) => (v === "" ? null : v), StringOrStringArray.nullable().optional()),
  leadershipSkills:z.preprocess((v) => (v === "" ? null : v), StringOrStringArray.nullable().optional()),
  professionalBackground: z.string().nullable().optional(),
  sportingJourney: z.string().nullable().optional(),
  term: z.string().nullable().optional(),
  socials: z.array(SocialLink).nullable().optional(),
  active: z.coerce.boolean().optional(),
});
export type UpdateLeaderDto = z.infer<typeof UpdateLeaderDto>;
