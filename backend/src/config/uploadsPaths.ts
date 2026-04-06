import fs from "node:fs";
import path from "node:path";
import { isCloudImageStorageEnabled } from "../utils/cloudinaryStorage.js";

/**
 * Root directory for `express.static("/uploads")`, avatars, and post images.
 * On Render/Fly/K8s the default app directory is ephemeral — set `UPLOADS_ROOT`
 * to a mounted persistent disk (same path on every instance if you scale >1).
 */
function resolveUploadsRoot(): string {
  const raw = process.env.UPLOADS_ROOT?.trim();
  if (raw) return path.resolve(raw);
  return path.resolve(process.cwd(), "uploads");
}

export const UPLOADS_ROOT = resolveUploadsRoot();

export const AVATARS_DIR = path.join(UPLOADS_ROOT, "avatars");
export const POSTS_UPLOAD_DIR = path.join(UPLOADS_ROOT, "posts");

fs.mkdirSync(AVATARS_DIR, { recursive: true });
fs.mkdirSync(POSTS_UPLOAD_DIR, { recursive: true });

if (
  process.env.NODE_ENV === "production" &&
  !process.env.UPLOADS_ROOT?.trim() &&
  !isCloudImageStorageEnabled()
) {
  console.warn(
    "[buddy-script] No durable image storage: set CLOUDINARY_URL (free tier) for hosted images, " +
      "or UPLOADS_ROOT to a persistent disk. Otherwise uploads are lost on restart (e.g. Render free).",
  );
}
