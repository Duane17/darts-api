import { Router } from "express";
import {
  listPosts,
  getPostBySlug,
  createPostHandler,
  updatePostHandler,
  deletePostHandler,
} from "../controllers/posts.controller";
import { requireAdmin } from "../middleware/auth";

export const postsRouter = Router();

// Public reads
postsRouter.get("/", listPosts);
postsRouter.get("/:slug", getPostBySlug);

// Admin writes
postsRouter.post("/", requireAdmin, createPostHandler);
postsRouter.patch("/:id", requireAdmin, updatePostHandler);
postsRouter.delete("/:id", requireAdmin, deletePostHandler);
