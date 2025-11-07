import { Request, Response } from "express";
import { PrismaClient, FixtureType, Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";
import { coerceBoolean, toSlug } from "../utils/parse";

const prisma = new PrismaClient();

function coerceTypeFromLeague(league?: string): FixtureType | undefined {
  if (!league) return undefined;
  const key = league.trim().toLowerCase();
  if (key === "srdl") return "SRDL_LEAGUE";
  if (key === "crdl") return "SMK_TRADING_CRDL";
  if (key === "smk" || key === "smk_trading_crdl") return "SMK_TRADING_CRDL";
  if (key === "all") return undefined;
  return undefined;
}

function buildTeamWhere(input: {
  q?: string;
  activeOnly?: string;
  season?: string;
  type?: FixtureType;
  league?: string;
}): Prisma.TeamWhereInput {
  const where: Prisma.TeamWhereInput = {};

  if (input.activeOnly?.toLowerCase() === "true") {
    where.active = true;
  }

  if (input.q && input.q.trim().length > 0) {
    const query = input.q.trim();
    const insensitive = "insensitive" as const;
    where.OR = [
      { name: { contains: query, mode: insensitive } },
      { city: { contains: query, mode: insensitive } },
      { homeCity: { contains: query, mode: insensitive } },
    ];
  }

  const resolvedType = input.type ?? coerceTypeFromLeague(input.league);
  if (input.season && resolvedType) {
    const season = input.season;
    const relFilter: Prisma.TeamWhereInput = {
      OR: [
        { homeFixtures: { some: { season, type: resolvedType } } },
        { awayFixtures: { some: { season, type: resolvedType } } },
      ],
    };
    if (where.OR && Array.isArray(where.OR) && where.OR.length > 0) {
      return { AND: [where, relFilter] };
    }
    Object.assign(where, relFilter);
  }

  return where;
}

export async function listTeams(req: Request, res: Response) {
  try {
    const { q, activeOnly, season, type, league, page, pageSize } = req.query as Partial<{
      q: string;
      activeOnly: string;
      season: string;
      type: FixtureType;
      league: string;
      page: string;
      pageSize: string;
    }>;

    const where = buildTeamWhere({ q, activeOnly, season, type, league });

    const pageNum = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
    const sizeNum = Math.min(100, Math.max(1, Number.parseInt(pageSize ?? "20", 10) || 20));
    const skip = (pageNum - 1) * sizeNum;

    const [total, items] = await Promise.all([
      prisma.team.count({ where }),
      prisma.team.findMany({
        where,
        orderBy: [{ name: "asc" }],
        skip,
        take: sizeNum,
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          city: true,
          homeVenue: true,
          homeCity: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const pages = Math.max(1, Math.ceil(total / sizeNum));
    res.json({ items, page: pageNum, pageSize: sizeNum, total, pages });
  } catch (err) {
    console.error("listTeams error", err);
    res.status(500).json({ error: "Failed to list teams" });
  }
}

export async function getTeamById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const t = await prisma.team.findUnique({ where: { id } });
    if (!t) return res.status(404).json({ error: "Not found" });
    res.json(t);
  } catch (err) {
    console.error("getTeamById error", err);
    res.status(500).json({ error: "Failed to load team" });
  }
}

export async function getTeamBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const t = await prisma.team.findUnique({ where: { slug } });
    if (!t) return res.status(404).json({ error: "Not found" });
    res.json(t);
  } catch (err) {
    console.error("getTeamBySlug error", err);
    res.status(500).json({ error: "Failed to load team" });
  }
}

/** Build the logoUrl relative path if a file was uploaded */
function buildLogoUrlFromFile(file?: Express.Multer.File | null): string | null {
  if (!file) return null;
  // Public URL matches your static mount: app.use("/uploads", express.static(UPLOAD_ROOT))
  // We stored under uploads/teams, so expose as /uploads/teams/<filename>
  return `/uploads/teams/${file.filename}`;
}

/** Delete a previously stored file if present */
function safeUnlink(absPath: string) {
  try {
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
  } catch {
    // ignore
  }
}

export async function createTeamHandler(req: Request, res: Response) {
  try {
    // If you are using multer, req.body fields are strings
    const body = req.body as {
      name?: string;
      slug?: string;
      city?: string | null;
      homeVenue?: string | null;
      homeCity?: string | null;
      active?: string | boolean;
    };

    const name = (body.name ?? "").trim();
    const slug = toSlug((body.slug ?? body.name ?? "").trim());
    const city = body.city?.trim() || null;
    const homeVenue = body.homeVenue?.trim() || null;
    const homeCity = (body.homeCity ?? body.city)?.trim() || null;
    const active = coerceBoolean(body.active, true);

    if (!name || !slug) {
      return res.status(400).json({ error: "name and slug are required" });
    }

    const file = req.file; // provided by upload.single("logo")
    const logoUrl = buildLogoUrlFromFile(file);

    const created = await prisma.team.create({
      data: {
        name,
        slug,
        city,
        homeVenue,
        homeCity,
        active,
        logoUrl, // may be null when no file uploaded
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("createTeam error", err);
    res.status(500).json({ error: "Failed to create team" });
  }
}

export async function updateTeamHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body as Partial<{
      name: string;
      slug: string;
      city: string | null;
      homeVenue: string | null;
      homeCity: string | null;
      active: string | boolean;
    }>;

    // Load current to know previous logo path if we need to delete it
    const current = await prisma.team.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: "Not found" });

    let nextSlug: string | undefined;
    if (typeof body.slug === "string" && body.slug.trim()) {
      nextSlug = toSlug(body.slug);
    }

    const patch: Prisma.TeamUpdateInput = {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(body.city !== undefined ? { city: body.city?.trim() || null } : {}),
      ...(body.homeVenue !== undefined ? { homeVenue: body.homeVenue?.trim() || null } : {}),
      ...(body.homeCity !== undefined ? { homeCity: body.homeCity?.trim() || null } : {}),
      ...(body.active !== undefined ? { active: coerceBoolean(body.active, current.active) } : {}),
    };

    // Handle new logo upload
    const file = req.file;
    if (file) {
      const newLogoUrl = buildLogoUrlFromFile(file);
      if (newLogoUrl) {
        // delete previous file if it was under /uploads/teams
        if (current.logoUrl && current.logoUrl.startsWith("/uploads/teams/")) {
          const abs = path.resolve(process.cwd(), `.${current.logoUrl}`);
          safeUnlink(abs);
        }
        patch.logoUrl = newLogoUrl;
      }
    }

    const updated = await prisma.team.update({
      where: { id },
      data: patch,
    });

    res.json(updated);
  } catch (err) {
    console.error("updateTeam error", err);
    res.status(500).json({ error: "Failed to update team" });
  }
}

export async function deleteTeamHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Delete file on disk if we stored one
    const current = await prisma.team.findUnique({ where: { id } });
    if (current?.logoUrl && current.logoUrl.startsWith("/uploads/teams/")) {
      const abs = path.resolve(process.cwd(), `.${current.logoUrl}`);
      safeUnlink(abs);
    }

    await prisma.team.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("deleteTeam error", err);
    res.status(500).json({ error: "Failed to delete team" });
  }
}
