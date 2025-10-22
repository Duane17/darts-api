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
app.use(express.json());

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
app.use("/uploads", express.static(UPLOAD_ROOT));




app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Request failed");
  const status = err.status || 400;
  const message = typeof err.message === "string" ? err.message : "Bad request";
  res.status(status).json({ error: message });
});


app.listen(ENV.PORT, () => {
  logger.info(`Server running on port ${ENV.PORT}`);
});
