import { Router } from "express";
import {
  readHomeContent,
  readAboutContent,
  readSiteSettings,
  putHomeContent,
  putAboutContent,
  readAnnouncementsContent,
  putAnnouncementsContent,
  deleteAnnouncementsContentHandler
} from "../controllers/content.controller";

export const contentRouter = Router();

// Public read only endpoints
contentRouter.get("/home", readHomeContent);
contentRouter.get("/about", readAboutContent);
contentRouter.get("/site-settings", readSiteSettings);
contentRouter.get("/announcements", readAnnouncementsContent);


// Admin authenticated mutations
contentRouter.put("/home", putHomeContent);
contentRouter.put("/about", putAboutContent);
contentRouter.put("/announcements", putAnnouncementsContent);
contentRouter.delete("/announcements", deleteAnnouncementsContentHandler);
contentRouter.post("/announcements", putAnnouncementsContent);

