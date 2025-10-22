import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { z } from "zod";
import {
  CreateLeaderDto,
  UpdateLeaderDto,
  ListLeadersQuery,
} from "../dto/leader.dto";
import { createLeader, updateLeader, removeLeader } from "../services/leaders";
import { toSlug } from "../lib/slug";

/** GET /leaders */
export async function listLeaders(req: Request, res: Response, next: NextFunction) {
  try {
    const q = ListLeadersQuery.parse(req.query);

    const where: any = {};
    if (q.activeOnly) where.active = true;
    if (q.q) {
      where.OR = [
        { name: { contains: q.q, mode: "insensitive" } },
        { title: { contains: q.q, mode: "insensitive" } },
        { bio: { contains: q.q, mode: "insensitive" } },
        { profile: { contains: q.q, mode: "insensitive" } },
      ];
    }

    const orderBy =
      q.sort === "name_desc" ? [{ name: "desc" as const }] :
      q.sort === "title_asc" ? [{ title: "asc" as const }, { name: "asc" as const }] :
      q.sort === "title_desc" ? [{ title: "desc" as const }, { name: "asc" as const }] :
      q.sort === "newest" ? [{ createdAt: "desc" as const }] :
      q.sort === "oldest" ? [{ createdAt: "asc" as const }] :
      [{ name: "asc" as const }];

    const [items, total] = await Promise.all([
      prisma.leader.findMany({
        where,
        orderBy,
        take: q.limit,
        skip: q.offset,
        select: {
          id: true,
          slug: true,
          name: true,
          title: true,
          photo: true,
          tagline: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.leader.count({ where }),
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

/** GET /leaders/:slug */
export async function getLeaderBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = z.object({ slug: z.string().min(1) }).parse(req.params);
    const leader = await prisma.leader.findUnique({ where: { slug } });
    if (!leader) return res.status(404).json({ error: "Leader not found" });
    res.json(leader);
  } catch (err) {
    next(err);
  }
}

/** POST /leaders */
export async function createLeaderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if ((req as any).file) {
      req.body.photo = `/uploads/leaders/${(req as any).file.filename}`;
    }

    if (!req.body.slug && req.body.name) {
      req.body.slug = toSlug(String(req.body.name));
    }

    for (const k of ["tagline","profile","bio","professionalBackground","sportingJourney","term"]) {
      if (req.body[k] === "") req.body[k] = undefined;
    }

    const dto = CreateLeaderDto.parse(req.body);
    const l = await createLeader(prisma, dto);
    res.status(201).json(l);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(409).json({ error: "Slug already exists" });
    next(err);
  }
}

/** PATCH /leaders/:id */
export async function updateLeaderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    if ((req as any).file) {
      req.body.photo = `/uploads/leaders/${(req as any).file.filename}`;
    }

    // (Optional) normalize empty strings to null to allow clearing
    for (const k of ["tagline","profile","bio","professionalBackground","sportingJourney","term"]) {
      if (req.body[k] === "") req.body[k] = null;
    }

    const dto = UpdateLeaderDto.parse(req.body);
    const l = await updateLeader(prisma, id, dto);
    res.json(l);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(409).json({ error: "Slug already exists" });
    if (err.code === "P2025") return res.status(404).json({ error: "Leader not found" });
    next(err);
  }
}

/** DELETE /leaders/:id  soft by default. Use ?hard=true to hard delete */
export async function deleteLeaderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { hard } = z.object({ hard: z.coerce.boolean().optional() }).parse(req.query);
    const l = await removeLeader(prisma, id, Boolean(hard));
    res.json(l);
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Leader not found" });
    next(err);
  }
}
