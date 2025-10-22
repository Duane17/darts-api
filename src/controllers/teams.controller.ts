import { Request, Response, NextFunction } from "express";
import path from "path";
import { prisma } from "../db/prisma";
import { z } from "zod";
import { CreateTeamDto, UpdateTeamDto, ListTeamsQuery } from "../dto/team.dto";
import { createTeam, removeTeam, updateTeam } from "../services/teams";


function publicUrlFor(file?: Express.Multer.File | null): string | undefined {
  if (!file) return undefined;
  const filename = path.basename(file.path);
  return `/uploads/teams/${filename}`;
}

/** GET /teams - list with search and pagination */
export async function listTeams(req: Request, res: Response, next: NextFunction) {
  try {
    const q = ListTeamsQuery.parse(req.query);
    const where: any = {};
    if (q.q) {
      where.OR = [
        { name: { contains: q.q, mode: "insensitive" } },
        { city: { contains: q.q, mode: "insensitive" } },
      ];
    }
    if (typeof q.active === "boolean") where.active = q.active;

    const skip = (q.page - 1) * q.pageSize;
    const [items, total] = await Promise.all([
      prisma.team.findMany({
        where,
        orderBy: [{ active: "desc" }, { name: "asc" }],
        skip,
        take: q.pageSize,
      }),
      prisma.team.count({ where }),
    ]);

    res.json({
      items,
      page: q.page,
      pageSize: q.pageSize,
      total,
      pages: Math.ceil(total / q.pageSize),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /teams/:id - by id */
export async function getTeamById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json(team);
  } catch (err) {
    next(err);
  }
}

/** GET /teams/slug/:slug - by slug */
export async function getTeamBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = z.object({ slug: z.string().min(1) }).parse(req.params);
    const team = await prisma.team.findUnique({ where: { slug } });
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json(team);
  } catch (err) {
    next(err);
  }
}

/** POST /teams - create */
export async function createTeamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = CreateTeamDto.parse(req.body);

    const logoUrlFromFile = publicUrlFor((req as any).file);
    const team = await createTeam(prisma, {
      ...dto,
      logoUrl: logoUrlFromFile ?? dto.logoUrl,
    });

    res.status(201).json(team);
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Team with same slug already exists" });
    }
    next(err);
  }
}

/** PATCH /teams/:id - update */
export async function updateTeamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const dto = UpdateTeamDto.parse(req.body);

    const logoUrlFromFile = publicUrlFor((req as any).file);
    const team = await updateTeam(prisma, id, {
      ...dto,
      logoUrl: logoUrlFromFile ?? dto.logoUrl,
    });

    res.json(team);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(409).json({ error: "Team with same slug already exists" });
    if (err.code === "P2025") return res.status(404).json({ error: "Team not found" });
    next(err);
  }
}

/** DELETE /teams/:id - soft delete by default, use ?hard=true to force hard delete */
export async function deleteTeamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { hard } = z.object({ hard: z.coerce.boolean().optional() }).parse(req.query);
    const result = await removeTeam(prisma, id, Boolean(hard));
    res.json(result);
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Team not found" });
    next(err);
  }
}
