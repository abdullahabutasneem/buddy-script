"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { normalizedPhotoUrl } from "@/lib/resolveAvatarUrl";
import { computeInitials } from "@/lib/userInitials";

export function ProfileAvatarForm() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState("?");
  const [seed, setSeed] = useState("user");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        user?: {
          firstName?: string;
          lastName?: string;
          email?: string;
          avatarUrl?: string | null;
        };
      };
      const u = data.user;
      if (!u) return;
      const displayName =
        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
        u.email ||
        "Account";
      setSeed(displayName);
      setInitials(computeInitials(u.firstName, u.lastName, u.email));
      setPhotoUrl(normalizedPhotoUrl(u.avatarUrl));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const form = e.currentTarget;
    const input = form.elements.namedItem("avatar") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setError("Choose a profile photo to upload.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("avatar", file);
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        body,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: { avatarUrl?: string | null };
      };
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      if (data.user) {
        setPhotoUrl(normalizedPhotoUrl(data.user.avatarUrl));
      }
      setMessage("Profile photo updated. Refresh the feed if it is open in another tab.");
      form.reset();
    } catch {
      setError("Network error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-md">
      <p className="mb-3 text-sm text-zinc-600">Current avatar</p>
      <div className="mb-4">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            width={96}
            height={96}
            className="rounded-full object-cover"
            style={{ width: 96, height: 96 }}
          />
        ) : (
          <InitialsAvatar
            initials={initials}
            seed={seed}
            sizePx={96}
            className="rounded-full"
          />
        )}
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-green-700" role="status">
            {message}
          </p>
        ) : null}
        <label className="block text-sm font-medium text-zinc-800" htmlFor="profile-avatar">
          Upload a profile photo
        </label>
        <input
          id="profile-avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="block w-full text-sm text-zinc-700"
        />
        <button
          type="submit"
          disabled={uploading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Save photo"}
        </button>
      </form>
    </div>
  );
}
