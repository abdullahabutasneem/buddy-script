/** Normalize stored `avatarUrl` for `<img src>`, or `null` when there is no photo (use initials instead). */
export function normalizedPhotoUrl(
  avatarUrl: string | null | undefined,
): string | null {
  if (avatarUrl == null || typeof avatarUrl !== "string") return null;
  const u = avatarUrl.trim();
  if (u.length === 0) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return u;
  return `/${u}`;
}
