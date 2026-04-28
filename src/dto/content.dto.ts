// src/dto/content.dto.ts
import { z } from "zod";

/** Shared */
export type ProgrammeItem = {
  id: string;
  title: string;
  description: string;
  cta: string;
  bgImage: string;
};

export type HomeContent = {
  /** Canonical field: 1–4 hero background images for the slideshow. */
  heroBgs: string[];
  ctaBg: string;
  programmes: ProgrammeItem[];
};

export type AboutContent = {
  heroBg: string;
  missionVision: {
    sectionBg: string;
    missionBg: string;
    visionBg: string;
    motto: string;
    mission: string;
    vision: string;
  };
  coreValues: {
    sectionBg: string;
    items: Array<{
      title: string;
      desc: string;
      bgImage: string;
    }>;
  };
};

// Zod schemas for runtime validation and safe narrowing
export const ProgrammeItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  cta: z.string().min(1),
  bgImage: z.string().min(1),
});

/**
 * Validates the canonical stored format (heroBgs array).
 * Used to verify records already persisted in the new shape.
 */
export const HomeContentSchema = z.object({
  heroBgs: z.array(z.string().min(1)).min(1).max(4),
  ctaBg: z.string().min(1),
  programmes: z.array(ProgrammeItemSchema),
});

/**
 * Accepts both the legacy single-image shape (`heroBg`) and the new
 * multi-image shape (`heroBgs`). Always normalises to `heroBgs` on output.
 *
 * Priority: heroBgs (if provided and non-empty) → heroBg wrapped in array.
 * Throws a ZodError if neither field yields at least one image.
 */
export const HomeContentInputSchema = z
  .object({
    /** Legacy single hero image – kept for backwards-compatible PUT requests. */
    heroBg: z.string().min(1).optional(),
    /** New multi-image array (1–4 entries). */
    heroBgs: z.array(z.string().min(1)).min(1).max(4).optional(),
    ctaBg: z.string().min(1),
    programmes: z.array(ProgrammeItemSchema),
  })
  .transform(({ heroBg, heroBgs, ctaBg, programmes }) => {
    const images = heroBgs?.length ? heroBgs : heroBg ? [heroBg] : [];
    if (images.length === 0) {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ["heroBgs"],
          message: "At least one hero background image is required.",
        },
      ]);
    }
    return { heroBgs: images, ctaBg, programmes };
  });

/** Output type produced by HomeContentInputSchema after transformation. */
export type HomeContentInput = z.output<typeof HomeContentInputSchema>;

/**
 * Migrates a raw DB record to the canonical HomeContent shape.
 * Handles both the legacy { heroBg } format and the new { heroBgs } format.
 * Returns null if the record is unrecognisable.
 */
export function parseRawHomeContent(raw: unknown): HomeContent | null {
  // New canonical format
  const canonical = HomeContentSchema.safeParse(raw);
  if (canonical.success) return canonical.data;

  // Legacy format: { heroBg: string, ctaBg: string, programmes: [...] }
  const legacy = z
    .object({
      heroBg: z.string().min(1),
      ctaBg: z.string().min(1),
      programmes: z.array(ProgrammeItemSchema),
    })
    .safeParse(raw);

  if (legacy.success) {
    return {
      heroBgs: [legacy.data.heroBg],
      ctaBg: legacy.data.ctaBg,
      programmes: legacy.data.programmes,
    };
  }

  return null;
}

export const AboutContentSchema = z.object({
  heroBg: z.string().min(1),
  missionVision: z.object({
    sectionBg: z.string().min(1),
    missionBg: z.string().min(1),
    visionBg: z.string().min(1),
    motto: z.string().min(1),
    mission: z.string().min(1),
    vision: z.string().min(1),
  }),
  coreValues: z.object({
    sectionBg: z.string().min(1),
    items: z.array(
      z.object({
        title: z.string().min(1),
        desc: z.string().min(1),
        bgImage: z.string().min(1),
      })
    ),
  }),
});

// Type guards
export function isHomeContent(x: unknown): x is HomeContent {
  return HomeContentSchema.safeParse(x).success;
}

export function isAboutContent(x: unknown): x is AboutContent {
  const res = AboutContentSchema.safeParse(x);
  return res.success;
}


// ==================== Announcements Content ====================

export type AnnouncementsContent = {
  backgroundImage?: string | null;
};

export const AnnouncementsContentSchema = z.object({
  backgroundImage: z.string().nullable().optional(),
});

// Type guard
export function isAnnouncementsContent(x: unknown): x is AnnouncementsContent {
  return AnnouncementsContentSchema.safeParse(x).success;
}