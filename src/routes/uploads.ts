import { Router } from "express";
import { uploadImage } from "../controllers/uploads.controller";

export const uploadsRouter = Router();

// POST /uploads/image
uploadsRouter.post("/image", uploadImage);
