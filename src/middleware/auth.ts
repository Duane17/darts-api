import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { UserRole } from "@prisma/client";

export type AuthedRequest = Request & {
  user?: { id: string; role: UserRole; email: string };
};

function getTokenFromRequest(req: Request) {
  const h = req.headers.authorization;
  if (h && h.startsWith("Bearer ")) return h.slice("Bearer ".length);
  const token = (req as any).cookies?.token;
  return token;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, ENV.JWT_SECRET) as any;
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    next();
  });
}
