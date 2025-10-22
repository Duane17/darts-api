import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { CreateResultDto, UpdateResultDto, ListResultsQuery } from "../dto/result.dto";
import { createResultAndUpdateTables, updateResultAndRecompute } from "../services/results";
/** GET /results with filters and pagination */
export async function listResults(req: Request, res: Response, next: NextFunction) {
  try {
    const q = ListResultsQuery.parse(req.query);

    const where: any = {};
    if (q.fixtureId) where.fixtureId = q.fixtureId;

    if (q.season || q.teamId || q.from || q.to) {
      where.fixture = {};
      if (q.season) where.fixture.season = q.season;
      if (q.teamId) {
        where.fixture.OR = [
          { homeTeamId: q.teamId },
          { awayTeamId: q.teamId },
        ];
      }
      if (q.from || q.to) {
        where.fixture.date = {};
        if (q.from) where.fixture.date.gte = q.from;
        if (q.to) where.fixture.date.lte = q.to;
      }
    }

    const orderBy =
      q.sort === "date_asc" ? [{ fixture: { date: "asc" as const } }] :
      q.sort === "created_asc" ? [{ createdAt: "asc" as const }] :
      q.sort === "created_desc" ? [{ createdAt: "desc" as const }] :
      [{ fixture: { date: "desc" as const } }];

    const skip = (q.page - 1) * q.pageSize;

    const [items, total] = await Promise.all([
      prisma.result.findMany({
        where,
        include: {
          fixture: {
            select: {
              id: true,
              season: true,
              date: true,
              week: true,
              title: true,
              homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
              awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
            },
          },
        },
        orderBy,
        skip,
        take: q.pageSize,
      }),
      prisma.result.count({ where }),
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


/** GET /results/:id single result by id */
export async function getResultById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const result = await prisma.result.findUnique({
      where: { id },
      include: {
        fixture: {
          select: {
            id: true,
            season: true,
            date: true,
            week: true,
            title: true,
            homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
            awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          },
        },
      },
    });
    if (!result) return res.status(404).json({ error: "Result not found" });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /result
 * Validates payload, creates or upserts a result, flips fixture to PLAYED,
 * and recomputes standings for both teams in a single transaction.
 */
export async function createResult(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = CreateResultDto.parse(req.body);
    const result = await createResultAndUpdateTables(prisma, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /results/:id
 * Validates path param and body, updates an existing result,
 * and recomputes standings for the two teams.
 */
export async function updateResult(req: Request, res: Response, next: NextFunction) {
  try {
    const idDto = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = UpdateResultDto.parse(req.body);

    const result = await updateResultAndRecompute(prisma, {
      resultId: idDto.id,
      ...body,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
