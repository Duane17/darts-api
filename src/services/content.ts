import { PrismaClient, PageKey } from "@prisma/client";
import type { HomeContent, AboutContent, AnnouncementsContent } from "../dto/content.dto";
import {
  isAboutContent,
  isAnnouncementsContent,
  HomeContentInputSchema,
  AboutContentSchema,
  AnnouncementsContentSchema,
  parseRawHomeContent,
} from "../dto/content.dto";
import { toUploadWebPath } from "../utils/uploads";

const prisma = new PrismaClient();

/**
 * Normalize any image-like field in HomeContent to a clean "/uploads/..." path
 * without protocol or host. Leaves absolute external URLs untouched.
 */
function normalizeHomeContentPaths(data: HomeContent): HomeContent {
  return {
    heroBgs: data.heroBgs.map(toUploadWebPath),
    ctaBg: toUploadWebPath(data.ctaBg),
    programmes: data.programmes.map((p) => ({
      ...p,
      bgImage: toUploadWebPath(p.bgImage),
    })),
  };
}

/**
 * Normalize any image-like field in AboutContent to a clean "/uploads/..." path
 * without protocol or host. Leaves absolute external URLs untouched.
 */
function normalizeAboutContentPaths(data: AboutContent): AboutContent {
  return {
    heroBg: toUploadWebPath(data.heroBg),
    missionVision: {
      ...data.missionVision,
      sectionBg: toUploadWebPath(data.missionVision.sectionBg),
      missionBg: toUploadWebPath(data.missionVision.missionBg),
      visionBg: toUploadWebPath(data.missionVision.visionBg),
    },
    coreValues: {
      sectionBg: toUploadWebPath(data.coreValues.sectionBg),
      items: data.coreValues.items.map((it) => ({
        ...it,
        bgImage: toUploadWebPath(it.bgImage),
      })),
    },
  };
}

function normalizeAnnouncementsContentPaths(data: AnnouncementsContent): AnnouncementsContent {
  return {
    backgroundImage: data.backgroundImage ? toUploadWebPath(data.backgroundImage) : null,
  };
}

/**
 * Fetch JSON payload from SiteContent by page key.
 * Returns the raw JSON or null if absent.
 */
async function getRawByPage(page: PageKey): Promise<unknown | null> {
  const row = await prisma.siteContent.findUnique({
    where: { page },
    select: { data: true },
  });
  return row?.data ?? null;
}

export async function getHomeContent(): Promise<HomeContent | null> {
  const raw = await getRawByPage(PageKey.HOME);
  if (!raw) return null;
  // parseRawHomeContent handles both legacy { heroBg } and canonical { heroBgs }
  return parseRawHomeContent(raw);
}

export async function getAboutContent(): Promise<AboutContent | null> {
  const raw = await getRawByPage(PageKey.ABOUT);
  if (raw && isAboutContent(raw)) return raw;
  return null;
}

/**
 * Upsert Home content after validating and normalizing its image paths.
 * Accepts both the legacy { heroBg } shape and the new { heroBgs } array shape.
 * Always persists in the canonical { heroBgs } format.
 * Throws ZodError for invalid input.
 */
export async function upsertHomeContent(payload: unknown): Promise<HomeContent> {
  const parsed = HomeContentInputSchema.parse(payload);
  const normalized = normalizeHomeContentPaths(parsed);

  await prisma.siteContent.upsert({
    where: { page: PageKey.HOME },
    update: { data: normalized },
    create: { page: PageKey.HOME, data: normalized },
  });

  return normalized;
}

/**
 * Upsert About content after validating and normalizing its image paths.
 * Throws ZodError for invalid input.
 */
export async function upsertAboutContent(payload: unknown): Promise<AboutContent> {
  const parsed = AboutContentSchema.parse(payload);
  const normalized = normalizeAboutContentPaths(parsed);

  await prisma.siteContent.upsert({
    where: { page: PageKey.ABOUT },
    update: { data: normalized },
    create: { page: PageKey.ABOUT, data: normalized },
  });

  return normalized;
}

// GET
export async function getAnnouncementsContent(): Promise<AnnouncementsContent | null> {
  const raw = await getRawByPage(PageKey.ANNOUNCEMENTS);
  if (raw && isAnnouncementsContent(raw)) return raw;
  return null;
}

// PUT (upsert)
export async function upsertAnnouncementsContent(payload: unknown): Promise<AnnouncementsContent> {
  const parsed = AnnouncementsContentSchema.parse(payload);
  const normalized = normalizeAnnouncementsContentPaths(parsed);

  await prisma.siteContent.upsert({
    where: { page: PageKey.ANNOUNCEMENTS },
    update: { data: normalized },
    create: { page: PageKey.ANNOUNCEMENTS, data: normalized },
  });

  return normalized;
}

// DELETE (remove the whole record)
export async function deleteAnnouncementsContent(): Promise<void> {
  await prisma.siteContent.deleteMany({
    where: { page: PageKey.ANNOUNCEMENTS },
  });
}

/**
 * Optional placeholder for site wide settings such as OG images.
 * Return null for now, or implement when you add API-SEO work.
 */
export async function getSiteSettings(): Promise<Record<string, unknown> | null> {
  return null;
}