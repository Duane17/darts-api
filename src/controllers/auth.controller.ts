import { Request, Response, NextFunction } from "express";
import type { CookieOptions } from "express";
import { prisma } from "../db/prisma";
import { LoginDto, RegisterDto } from "../dto/auth.dto";
import { createUser, signJwt, verifyUser } from "../services/auth";
import { UserRole } from "@prisma/client";

const COOKIE_NAME = "token";

// Centralized cookie options so literals do not widen to string
const BASE_COOKIE_OPTS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    ...BASE_COOKIE_OPTS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function cookieClearOpts(): CookieOptions {
  // No maxAge so the cookie is cleared immediately
  return { ...BASE_COOKIE_OPTS };
}

/**
 * POST /auth/register
 * If there are no users yet, the first registered user becomes ADMIN.
 * Otherwise, registration creates an EDITOR.
 * You can lock this route later behind requireAdmin if you want invite only.
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = RegisterDto.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const userCount = await prisma.user.count();
    const role: UserRole = userCount === 0 ? "ADMIN" : "EDITOR";

    const user = await createUser(prisma, dto.email, dto.password, role);
    const token = signJwt({ sub: user.id, role: user.role, email: user.email });

    setAuthCookie(res, token);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/login
 * Verifies credentials and issues a JWT, also sets httpOnly cookie for the admin UI.
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = LoginDto.parse(req.body);
    const user = await verifyUser(prisma, dto.email, dto.password);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const token = signJwt({ sub: user.id, role: user.role, email: user.email });
    setAuthCookie(res, token);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

/** POST /auth/logout clears the cookie. Frontend should also drop token if stored separately. */
export async function logout(_req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, cookieClearOpts());
  res.json({ ok: true });
}
