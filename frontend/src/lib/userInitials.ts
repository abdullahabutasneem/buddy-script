/** Two-letter (or one-letter) initials from name fields — e.g. Tasneem Akib → TA */
export function computeInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
): string {
  const firstCharUpper = (s: string) => {
    const chars = [...s.trim()];
    const c = chars[0];
    return c ? c.toLocaleUpperCase() : "";
  };

  const f = firstName?.trim() ?? "";
  const l = lastName?.trim() ?? "";

  if (f && l) {
    const a = firstCharUpper(f);
    const b = firstCharUpper(l);
    return `${a}${b}`.slice(0, 2);
  }

  if (f) {
    const chars = [...f];
    if (chars.length >= 2) {
      return `${chars[0]}${chars[1]}`.toLocaleUpperCase();
    }
    return firstCharUpper(f) || "?";
  }

  if (l) {
    const chars = [...l];
    if (chars.length >= 2) {
      return `${chars[0]}${chars[1]}`.toLocaleUpperCase();
    }
    return firstCharUpper(l) || "?";
  }

  const em = email?.trim();
  if (em) {
    const local = em.split("@")[0] ?? em;
    const alnum = [...local.replace(/[^a-zA-Z0-9]/g, "")];
    if (alnum.length >= 2) {
      return `${alnum[0]}${alnum[1]}`.toLocaleUpperCase();
    }
    if (alnum.length === 1) {
      return `${alnum[0]}${alnum[0]}`.toLocaleUpperCase();
    }
  }

  return "?";
}

/** Stable hue from a string so the same user keeps the same avatar color */
export function initialsAvatarBackground(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h + seed.charCodeAt(i) * (i + 17)) % 360;
  }
  return `hsl(${h} 52% 44%)`;
}
