import { Prisma, PrismaClient, PostStatus } from "@prisma/client";
import { toSlug } from "../lib/slug";

function resolveSlug(input: { slug?: string; title?: string }) {
  if (input.slug && input.slug.trim()) return toSlug(input.slug);
  if (input.title && input.title.trim()) return toSlug(input.title);
  return undefined;
}

/** Create */

export async function createPost(
  prisma: PrismaClient,
  input: {
    title: string;
    body: string;
    coverImage?: string;
    excerpt?: string;
    status?: PostStatus;
    publishedAt?: Date;
    slug?: string;
  }
) {
  const slug = resolveSlug({ slug: input.slug, title: input.title })!;
  const status: PostStatus = input.status ?? "DRAFT";

  // Decide publishedAt based on desired status when not provided
  const publishedAt: Date | null =
    input.publishedAt !== undefined
      ? input.publishedAt
      : status === "PUBLISHED"
      ? new Date()
      : null;

  const data: Prisma.PostUncheckedCreateInput = {
    title: input.title,
    slug,
    body: input.body,
    coverImage: input.coverImage,
    excerpt: input.excerpt,
    status,
    publishedAt,
  };

  return prisma.post.create({ data });
}

/** Update */

export async function updatePost(
  prisma: PrismaClient,
  id: string,
  input: {
    title?: string;
    body?: string;
    coverImage?: string;
    excerpt?: string | null;
    status?: PostStatus;
    publishedAt?: Date | null;
    slug?: string;
  }
) {
  // Compute the next status if provided
  const nextStatus: PostStatus | undefined = input.status;

  // If caller did not specify publishedAt, derive it from the next status change
  // If status is set to PUBLISHED, default publishedAt to now
  // If status is set to anything else, default publishedAt to null
  let derivedPublishedAt: Date | null | undefined = undefined;
  if (nextStatus !== undefined && input.publishedAt === undefined) {
    derivedPublishedAt = nextStatus === "PUBLISHED" ? new Date() : null;
  }

  const data: Prisma.PostUncheckedUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.body !== undefined) data.body = input.body;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage;
  if (input.excerpt !== undefined) data.excerpt = input.excerpt;

  // Status must use the field operation for update
  if (nextStatus !== undefined) {
    data.status = { set: nextStatus };
  }

  // Slug handling from explicit slug or from new title
  if (input.slug !== undefined) data.slug = toSlug(input.slug);
  else if (input.title !== undefined) data.slug = toSlug(input.title);

  // Apply publishedAt: explicit input wins, otherwise use derived value
  if (input.publishedAt !== undefined) {
    data.publishedAt = input.publishedAt;
  } else if (derivedPublishedAt !== undefined) {
    data.publishedAt = derivedPublishedAt;
  }

  return prisma.post.update({ where: { id }, data });
}

export async function deletePost(prisma: PrismaClient, id: string) {
  return prisma.post.delete({ where: { id } });
}
