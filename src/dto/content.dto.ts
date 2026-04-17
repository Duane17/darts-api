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
  heroBg: string;
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

export const HomeContentSchema = z.object({
  heroBg: z.string().min(1),
  ctaBg: z.string().min(1),
  programmes: z.array(ProgrammeItemSchema),
});

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
  const res = HomeContentSchema.safeParse(x);
  return res.success;
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