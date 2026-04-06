import fs from "node:fs";
import { v2 as cloudinary } from "cloudinary";

const CLOUDINARY_HOST = "res.cloudinary.com";

/** Parse `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` (dashboard “API environment variable”). */
function parseCloudinaryConnectionUrl(raw: string): {
  cloud_name: string;
  api_key: string;
  api_secret: string;
} | null {
  const trimmed = raw.trim();
  if (!trimmed.toLowerCase().startsWith("cloudinary://")) {
    return null;
  }
  try {
    const uri = new URL(trimmed);
    const cloud_name = uri.hostname;
    const api_key = decodeURIComponent(uri.username || "");
    const api_secret = decodeURIComponent(uri.password || "");
    if (!cloud_name || !api_key || !api_secret) return null;
    return { cloud_name, api_key, api_secret };
  } catch {
    return null;
  }
}

function configureIfPossible(): boolean {
  const url = process.env.CLOUDINARY_URL?.trim();
  if (url) {
    const parsed = parseCloudinaryConnectionUrl(url);
    if (!parsed) {
      console.error(
        "[buddy-script] CLOUDINARY_URL is set but invalid. Use cloudinary://API_KEY:API_SECRET@CLOUD_NAME from the Cloudinary dashboard.",
      );
      return false;
    }
    cloudinary.config({
      secure: true,
      cloud_name: parsed.cloud_name,
      api_key: parsed.api_key,
      api_secret: parsed.api_secret,
    });
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
  try {
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[buddy-script] Cloudinary upload failed:", msg);
    throw err;
  }
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
