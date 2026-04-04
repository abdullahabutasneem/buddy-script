import mongoose from "mongoose";

export type FeedCursorPayload = {
  /** `createdAt` ms (UTC) */
  t: number;
  /** Post `_id` hex */
  i: string;
};

const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365; // reject ancient cursors

export function encodeFeedCursor(createdAt: Date, id: mongoose.Types.ObjectId): string {
  const payload: FeedCursorPayload = { t: createdAt.getTime(), i: id.toHexString() };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeFeedCursor(raw: unknown): FeedCursorPayload | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const o = JSON.parse(json) as FeedCursorPayload;
    if (typeof o.t !== "number" || typeof o.i !== "string") return null;
    if (!Number.isFinite(o.t) || !mongoose.isValidObjectId(o.i)) return null;
    if (Date.now() - o.t > MAX_AGE_MS || o.t - Date.now() > MAX_AGE_MS) return null;
    return o;
  } catch {
    return null;
  }
}
