import { Router } from "express";
import {
  listAnnouncements,
  getAnnouncementById,
  createAnnouncementHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
} from "../controllers/announcements.controller";


export const announcementsRouter = Router();

announcementsRouter.get("/", listAnnouncements);
announcementsRouter.get("/:id", getAnnouncementById);
announcementsRouter.post("/", createAnnouncementHandler);
announcementsRouter.patch("/:id", updateAnnouncementHandler);
announcementsRouter.delete("/:id", deleteAnnouncementHandler);
