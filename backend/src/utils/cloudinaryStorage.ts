import fs from "node:fs";
import { v2 as cloudinary } from "cloudinary";

const CLOUDINARY_HOST = "res.cloudinary.com";

function configureIfPossible(): boolean {
  const url = process.env.CLOUDINARY_URL?.trim();
  if (url) {
    cloudinary.config({ secure: true, url });
    return true;
  }
  const name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (name && key && secret) {
    cloudinary.config({ secure: true, cloud_name: name, api_key: key, api_secret: secret });
    return true;
  }
  return false;
}

let configured = false;

/** Use Cloudinary (free tier works) so images survive ephemeral hosts like Render free. */
export function isCloudImageStorageEnabled(): boolean {
  if (configured) return true;
  configured = configureIfPossible();
  return configured;
}

export function unlinkQuietly(filePath: string | undefined): void {
  if (!filePath || !fs.existsSync(filePath)) return;
  try {
    fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }
}

/**
 * Derive public_id from a typical secure_url for destroy().
 * Handles optional transformation segments before /v123/...
 */
export function cloudinaryPublicIdFromSecureUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes(CLOUDINARY_HOST)) return null;
    const match = u.pathname.match(/\/upload\/(.+)$/);
    if (!match) return null;
    const segments = match[1]!.split("/").filter(Boolean);
    while (segments.length > 0) {
      const head = segments[0]!;
      if (head.startsWith("v") && /^v\d+$/i.test(head)) {
        segments.shift();
        break;
      }
      if (head.includes(",") || head.match(/^([a-z]+)_/i)) {
        segments.shift();
        continue;
      }
      break;
    }
    if (segments.length === 0) return null;
    const last = segments[segments.length - 1]!;
    if (last.includes(".")) {
      segments[segments.length - 1] = last.replace(/\.[^.]+$/, "");
    }
    return segments.join("/");
  } catch {
    return null;
  }
}

export async function uploadImageFileToCloudinary(
  localPath: string,
  folder: string,
): Promise<{ secureUrl: string }> {
  if (!isCloudImageStorageEnabled()) {
    throw new Error("Cloudinary is not configured");
  }
  const result = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: "image",
    overwrite: false,
  });
  const secureUrl = result.secure_url as string | undefined;
  if (!secureUrl) {
    throw new Error("Cloudinary upload returned no URL");
  }
  return { secureUrl };
}

export async function destroyCloudinaryAssetByUrl(url: string | null | undefined): Promise<void> {
  if (!url || !isCloudImageStorageEnabled()) return;
  const publicId = cloudinaryPublicIdFromSecureUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch {
    /* ignore — asset may already be gone */
  }
}
