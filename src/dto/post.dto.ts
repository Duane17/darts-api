import { z } from "zod";
import { PostStatus } from "@prisma/client";

export const ListPostsQuery = z.object({
  q: z.string().trim().optional(),
  status: z.nativeEnum(PostStatus).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  includeUnpublished: z.coerce.boolean().optional().default(false),
});
export type ListPostsQuery = z.infer<typeof ListPostsQuery>;

export const CreatePostDto = z.object({
  title: z.string().min(3).max(160),
  coverImage: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  excerpt: z.string().max(300).optional(),
  body: z.string().min(1),
  status: z.nativeEnum(PostStatus).optional().default("DRAFT"),
  publishedAt: z.coerce.date().optional(),
  slug: z.string().min(1).optional(), // if omitted, derived from title
});
export type CreatePostDto = z.infer<typeof CreatePostDto>;

export const UpdatePostDto = z.object({
  title: z.string().min(3).max(160).optional(),
  coverImage: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  excerpt: z.string().max(300).nullable().optional(),
  body: z.string().min(1).optional(),
  status: z.nativeEnum(PostStatus).optional(),
  publishedAt: z.coerce.date().nullable().optional(),
  slug: z.string().min(1).optional(),
});
export type UpdatePostDto = z.infer<typeof UpdatePostDto>;
