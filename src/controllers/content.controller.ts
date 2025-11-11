import type { Request, Response, NextFunction } from "express";
import {
  getHomeContent,
  getAboutContent,
  getSiteSettings,
  upsertHomeContent,
  upsertAboutContent,
} from "../services/content";
import { ZodError } from "zod";

export async function readHomeContent(_req: Request, res: Response, next: NextFunction) {
  try {
    const content = await getHomeContent();
    if (!content) {
      return res.status(404).json({ error: "Home content not found" });
    }
    return res.status(200).json(content);
  } catch (err) {
    return next(err);
  }
}

export async function readAboutContent(_req: Request, res: Response, next: NextFunction) {
  try {
    const content = await getAboutContent();
    if (!content) {
      return res.status(404).json({ error: "About content not found" });
    }
    return res.status(200).json(content);
  } catch (err) {
    return next(err);
  }
}

export async function readSiteSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await getSiteSettings();
    if (!settings) {
      return res.status(404).json({ error: "Site settings not found" });
    }
    return res.status(200).json(settings);
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /content/home
 * Body must match HomeContent schema. Returns the persisted normalized content.
 */
export async function putHomeContent(req: Request, res: Response, next: NextFunction) {
  try {
    const saved = await upsertHomeContent(req.body);
    return res.status(200).json(saved);
  } catch (err: any) {
    if (err instanceof ZodError) {
      const { fieldErrors, formErrors } = err.flatten();
      return res.status(400).json({
        error: "Invalid content payload",
        fieldErrors,
        formErrors,
      });
    }
    return next(err);
  }
}

/**
 * PUT /content/about
 * Body must match AboutContent schema. Returns the persisted normalized content.
 */
export async function putAboutContent(req: Request, res: Response, next: NextFunction) {
  try {
    const saved = await upsertAboutContent(req.body);
    return res.status(200).json(saved);
  } catch (err: any) {
    if (err instanceof ZodError) {
      const { fieldErrors, formErrors } = err.flatten();
      return res.status(400).json({
        error: "Invalid content payload",
        fieldErrors,
        formErrors,
      });
    }
    return next(err);
  }
}
