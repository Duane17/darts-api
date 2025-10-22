import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { z } from "zod";
import { CreateFixtureDto, UpdateFixtureDto, ListFixturesQuery } from "../dto/fixture.dto";
import { createFixture, softDeleteFixture, updateFixture } from "../services/fixtures";

/** GET /fixtures with filters, search and pagination */
export async function listFixtures(req: Request, res: Response, next: NextFunction) {
  try {
    const q = ListFixturesQuery.parse(req.query);

    const where: any = {};
    if (q.season) where.season = q.season;
    if (q.status) where.status = q.status;
    if (q.type) where.type = q.type;
    if (!q.includeCanceled) {
      where.status = where.status ?? { not: "CANCELED" };
    }
    if (q.week) where.week = q.week;
    if (q.weekFrom || q.weekTo) {
      where.week = {};
      if (q.weekFrom) where.week.gte = q.weekFrom;
      if (q.weekTo) where.week.lte = q.weekTo;
    }
    if (q.from || q.to) {
      where.date = {};
      if (q.from) where.date.gte = q.from;
      if (q.to) where.date.lte = q.to;
    }
    if (q.teamId) {
      where.OR = [
        { homeTeamId: q.teamId },
        { awayTeamId: q.teamId },
      ];
    }

    const orderBy =
      q.sort === "date_desc" ? [{ date: "desc" as const }] :
      q.sort === "week_asc" ? [{ week: "asc" as const }, { date: "asc" as const }] :
      q.sort === "week_desc" ? [{ week: "desc" as const }, { date: "desc" as const }] :
      [{ date: "asc" as const }];

    const skip = (q.page - 1) * q.pageSize;

    const [items, total] = await Promise.all([
      prisma.fixture.findMany({
        where,
        include: {
          homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          result: true,
        },
        orderBy,
        skip,
        take: q.pageSize,
      }),
      prisma.fixture.count({ where }),
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

/** POST /fixtures - create a new fixture */
export async function createFixtureHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = CreateFixtureDto.parse(req.body);
    const fix = await createFixture(prisma, {
      ...dto,
      endDate: dto.endDate ?? null,
      city: dto.city ?? null,
      description: dto.description ?? null,
      awayTeamId: dto.isBye ? null : dto.awayTeamId ?? null,
    });
    res.status(201).json(fix);
  } catch (err: any) {
    if (err.code === "P2002") {
      // unique(season, date, homeTeamId, awayTeamId)
      return res.status(409).json({ error: "Duplicate fixture for this date and teams in the season" });
    }
    next(err);
  }
}

/** PATCH /fixtures/:id - update fields */
export async function updateFixtureHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const dto = UpdateFixtureDto.parse(req.body);
    const fix = await updateFixture(prisma, id, dto);
    res.json(fix);
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Updated values conflict with an existing fixture" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Fixture not found" });
    }
    next(err);
  }
}

/** DELETE /fixtures/:id - soft delete by marking CANCELED */
export async function deleteFixtureHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const fix = await softDeleteFixture(prisma, id);
    res.json(fix);
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Fixture not found" });
    }
    next(err);
  }
}
