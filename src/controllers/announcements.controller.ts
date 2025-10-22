import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { z } from "zod";
import {
  CreateAnnouncementDto,
  ListAnnouncementsQuery,
  UpdateAnnouncementDto,
} from "../dto/announcement.dto";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../services/announcements";

/** GET /announcements */
export async function listAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const q = ListAnnouncementsQuery.parse(req.query);

    // Build filters explicitly and assign once
    const and: any[] = [];
    const or: any[] = [];

    // Text search across title and body
    if (q.q) {
      or.push(
        { title: { contains: q.q, mode: "insensitive" } },
        { body: { contains: q.q, mode: "insensitive" } }
      );
    }

    // Priority filter
    if (q.priority) {
      and.push({ priority: q.priority });
    }

    // Optional time window on publishedAt, if provided
    if (q.since || q.until) {
      const range: any = {};
      if (q.since) range.gte = q.since;
      if (q.until) range.lte = q.until;
      and.push({ publishedAt: range });
    }

    // Assemble Prisma where without any "active only" gating
    const where: any = {};
    if (and.length) where.AND = and;
    if (or.length) where.OR = or;

    // Sorting: newest by publishedAt, with createdAt as tiebreaker
    const orderBy =
      q.sort === "newest"
        ? [{ publishedAt: "desc" as const }, { createdAt: "desc" as const }]
        : [{ publishedAt: "asc" as const }, { createdAt: "asc" as const }];

    // Pagination with safe defaults
    const limit = Number.isFinite(q.limit as number) ? q.limit : 20;
    const offset = Number.isFinite(q.offset as number) ? q.offset : 0;

    const [items, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.announcement.count({ where }),
    ]);

    res.json({
      items,
      limit,
      offset,
      total,
      hasMore: offset + items.length < total,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /announcements/:id */
export async function getAnnouncementById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const a = await prisma.announcement.findUnique({ where: { id } });
    if (!a) return res.status(404).json({ error: "Announcement not found" });
    res.json(a);
  } catch (err) {
    next(err);
  }
}

/** POST /announcements */
export async function createAnnouncementHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = CreateAnnouncementDto.parse(req.body);
    const a = await createAnnouncement(prisma, dto);
    res.status(201).json(a);
  } catch (err) {
    next(err);
  }
}

/** PATCH /announcements/:id */
export async function updateAnnouncementHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const dto = UpdateAnnouncementDto.parse(req.body);
    const a = await updateAnnouncement(prisma, id, dto);
    res.json(a);
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Announcement not found" });
    next(err);
  }
}

/** DELETE /announcements/:id */
export async function deleteAnnouncementHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const a = await deleteAnnouncement(prisma, id);
    res.json(a);
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Announcement not found" });
    next(err);
  }
}
