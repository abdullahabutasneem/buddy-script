/** Human-readable relative time for feed headers (e.g. “5 minutes ago”). */
export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  if (Number.isNaN(ms) || ms < 0) return "";

  const sec = Math.floor(ms / 1000);
  if (sec < 45) return "Just now";

  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min} minute${min === 1 ? "" : "s"} ago`;
  }

  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  }

  const day = Math.floor(hr / 24);
  if (day < 7) {
    return `${day} day${day === 1 ? "" : "s"} ago`;
  }

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
