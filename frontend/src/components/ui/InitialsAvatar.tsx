import type { CSSProperties } from "react";
import { initialsAvatarBackground } from "@/lib/userInitials";

type InitialsAvatarSize = "sm" | "md" | "lg";

type InitialsAvatarProps = {
  initials: string;
  /** Used to pick a stable background color */
  seed: string;
  size?: InitialsAvatarSize;
  /** Overrides `size` width/height (e.g. 96 for profile page) */
  sizePx?: number;
  /** Gray “loading / unknown” style */
  muted?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

export function InitialsAvatar({
  initials,
  seed,
  size = "md",
  sizePx,
  muted = false,
  className = "",
  style,
  title,
}: InitialsAvatarProps) {
  const text = (initials.trim().slice(0, 2) || "?").toLocaleUpperCase();
  const bg = muted ? "#9ca3af" : initialsAvatarBackground(seed || "user");

  const dimStyle: CSSProperties | undefined =
    sizePx != null
      ? {
          width: sizePx,
          height: sizePx,
          fontSize: Math.max(12, Math.round(sizePx * 0.36)),
        }
      : undefined;

  const sizeClass =
    sizePx != null ? "" : `_buddy_initials_avatar--${size}`;

  return (
    <span
      className={`_buddy_initials_avatar ${sizeClass} ${muted ? "_buddy_initials_avatar--muted" : ""} ${className}`.trim()}
      style={{ backgroundColor: bg, ...dimStyle, ...style }}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      {text}
    </span>
  );
}
