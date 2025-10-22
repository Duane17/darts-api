import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { z } from "zod";
import { CreatePostDto, ListPostsQuery, UpdatePostDto } from "../dto/post.dto";

export async function listPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const q = ListPostsQuery.parse(req.query);

    const where: any = {};
    if (!q.includeUnpublished) {
      where.status = "PUBLISHED";
    } else if (q.status) {
      where.status = q.status;
    }
    if (q.q) {
      where.OR = [
        { title: { contains: q.q, mode: "insensitive" } },
        { excerpt: { contains: q.q, mode: "insensitive" } },
        { body: { contains: q.q, mode: "insensitive" } },
      ];
    }

    const orderBy = q.sort === "newest"
      ? [{ publishedAt: "desc" as const }, { createdAt: "desc" as const }]
      : [{ publishedAt: "asc" as const }, { createdAt: "asc" as const }];

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        take: q.limit,
        skip: q.offset,
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          excerpt: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      items,
      limit: q.limit,
      offset: q.offset,
      total,
      hasMore: q.offset + items.length < total,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPostBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = z.object({ slug: z.string().min(1) }).parse(req.params);
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    next(err);
  }
}

export async function createPostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = CreatePostDto.parse(req.body);
    // Service handles slug and publish fields
    const post = await (await import("../services/posts")).createPost(prisma, dto);
    res.status(201).json(post);
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Slug already exists" });
    }
    next(err);
  }
}

export async function updatePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const dto = UpdatePostDto.parse(req.body);
    const post = await (await import("../services/posts")).updatePost(prisma, id, dto);
    res.json(post);
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Slug already exists" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    next(err);
  }
}

export async function deletePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const post = await (await import("../services/posts")).deletePost(prisma, id);
    res.json(post);
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    next(err);
  }
}
