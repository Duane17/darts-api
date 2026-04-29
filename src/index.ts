import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path"
import fs from "fs"
import { ENV } from "./config/env";
import { logger } from "./config/logger";
import { authRouter } from "./routes/auth";
import { resultsRouter } from "./routes/results";
import { standingsRouter } from "./routes/standings";
import { teamsRouter } from "./routes/teams";
import { fixturesRouter } from "./routes/fixtures";
import { postsRouter } from "./routes/posts";
import { announcementsRouter } from "./routes/announcements";
import { leadersRouter } from "./routes/leaders.routes";
import { contentRouter } from "./routes/content";
import { uploadsRouter } from "./routes/uploads";

const app = express();

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const TEAM_UPLOAD_DIR = path.join(UPLOAD_ROOT, "teams");
const LEADER_UPLOAD_DIR = path.join(UPLOAD_ROOT, "leaders");
fs.mkdirSync(TEAM_UPLOAD_DIR, { recursive: true });
fs.mkdirSync(LEADER_UPLOAD_DIR, { recursive: true });

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ENV.CORS_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Test route
app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/results", resultsRouter);
app.use("/standings", standingsRouter);
app.use("/teams", teamsRouter);
app.use("/fixtures", fixturesRouter);
app.use("/posts", postsRouter);
app.use("/announcements", announcementsRouter);
app.use("/leaders", leadersRouter);
app.use("/uploads", uploadsRouter);


app.use("/content", contentRouter);

app.use(
  "/uploads",
  express.static(UPLOAD_ROOT, {
    dotfiles: "ignore",
    etag: true,
    lastModified: true,
    maxAge: "0",
    setHeaders: (res, filePath) => {
      const p = filePath.replace(/\\/g, "/");
      const isHashed = /\.[0-9a-f]{8,}\.[a-z0-9]+$/i.test(p);
      const isStamped = /-\d{10,}\.[a-z0-9]+$/i.test(p);

      if (isHashed || isStamped) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=3600");
      }
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/octet-stream");
      }
    },
  })
);




app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Request failed");
  const status = err.status || 400;
  const message = typeof err.message === "string" ? err.message : "Bad request";
  res.status(status).json({ error: message });
});


app.listen(ENV.PORT, () => {
  logger.info(`Server running on port ${ENV.PORT}`);
});
