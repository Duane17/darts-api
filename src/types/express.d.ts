import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: "ADMIN" | "EDITOR";
    };
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
  }
}
