import { Router } from "express";
import {
  readHomeContent,
  readAboutContent,
  readSiteSettings,
  putHomeContent,
  putAboutContent,
} from "../controllers/content.controller";

export const contentRouter = Router();

// Public read only endpoints
contentRouter.get("/home", readHomeContent);
contentRouter.get("/about", readAboutContent);
contentRouter.get("/site-settings", readSiteSettings);

// Admin authenticated mutations
contentRouter.put("/home", putHomeContent);
contentRouter.put("/about", putAboutContent);
