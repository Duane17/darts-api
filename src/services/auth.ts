import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { ENV } from "../config/env";

type JwtPayload = { sub: string; role: UserRole; email: string };

/** Resolve and validate the secret once so overloads match correctly */
const JWT_SECRET: Secret = (() => {
  const s = ENV.JWT_SECRET; // ensure this is a string in your env loader
  if (!s) {
    throw new Error("JWT_SECRET is not set. Add it to your .env");
  }
  return s as Secret;
})();

const DEFAULT_SIGN_OPTS: SignOptions = {
  expiresIn: (ENV.JWT_EXPIRES_IN || "7d") as unknown as number | undefined,
};

export function signJwt(payload: JwtPayload, options: SignOptions = {}) {
  return jwt.sign(payload, JWT_SECRET, { ...DEFAULT_SIGN_OPTS, ...options });
}

export async function createUser(
  prisma: PrismaClient,
  email: string,
  password: string,
  role: UserRole = "EDITOR"
) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { email, passwordHash: hash, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });
}

export async function verifyUser(prisma: PrismaClient, email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, email: user.email, role: user.role };
}
