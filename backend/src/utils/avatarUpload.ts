import fs from "node:fs";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AVATARS_DIR } from "../config/uploadsPaths.js";
import { destroyCloudinaryAssetByUrl } from "./cloudinaryStorage.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AVATARS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    cb(null, `${base}${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|pjpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, ok);
  },
});

/** Optional `avatar` file field; leaves `req.file` undefined if none sent. */
export function optionalAvatarUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  avatarUpload.single("avatar")(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Profile photo too large (max 3MB)" });
      return;
    }
    res.status(400).json({
      error: "Invalid profile photo (use JPEG, PNG, GIF, or WebP)",
    });
  });
}

export function publicAvatarPath(filename: string): string {
  return `/uploads/avatars/${filename}`;
}

export function removeStoredAvatarIfOwned(avatarUrl: string | null | undefined): void {
  if (!avatarUrl) return;
  if (avatarUrl.startsWith("https://")) {
    void destroyCloudinaryAssetByUrl(avatarUrl);
    return;
  }
  if (!avatarUrl.startsWith("/uploads/avatars/")) return;
  const name = avatarUrl.slice("/uploads/avatars/".length);
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return;
  }
  const full = path.join(AVATARS_DIR, name);
  if (fs.existsSync(full)) {
    try {
      fs.unlinkSync(full);
    } catch {
      /* ignore */
    }
  }
}
