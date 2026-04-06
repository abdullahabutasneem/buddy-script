"use client";

import { useCallback, useEffect, useState } from "react";
import Script from "next/script";
import { normalizedPhotoUrl } from "@/lib/resolveAvatarUrl";
import { computeInitials } from "@/lib/userInitials";
import { FeedComposer } from "./FeedComposer";
import { FeedMarkup, type FeedHeaderProfile } from "./FeedMarkup";
import { FunctionalPostFeed } from "./FunctionalPostFeed";
import type { FeedPost } from "./feedTypes";
import type { FeedViewerBrief } from "./TimelinePostCard";
import { BUDDY_AVATAR_UPDATED_EVENT } from "@/lib/buddyProfileEvents";

type MeUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string | null;
};

export function FeedClient() {
  const [headerProfile, setHeaderProfile] = useState<FeedHeaderProfile | null>(
    null,
  );
  const [viewer, setViewer] = useState<FeedViewerBrief>(null);
  const [recentCreatedPost, setRecentCreatedPost] = useState<FeedPost | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const toggleDark = useCallback(() => {
    setDarkMode((d) => !d);
  }, []);

  const toggleNotify = useCallback(() => {
    setNotifyOpen((o) => !o);
    setProfileOpen(false);
  }, []);

  const toggleProfile = useCallback(() => {
    setProfileOpen((o) => !o);
    setNotifyOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setProfileOpen(false);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* still clear client session below */
    }
    window.location.replace("/login");
  }, []);

  const layoutClassName = `_layout _layout_main_wrapper${darkMode ? " _dark_wrapper" : ""}`;
  const notifyDropdownClassName = `_notification_dropdown${notifyOpen ? " show" : ""}`;
  const profileDropdownClassName = `_nav_profile_dropdown _profile_dropdown${profileOpen ? " show" : ""}`;

  const applyMeUser = useCallback((u: MeUser) => {
    const displayName =
      [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
      u.email ||
      "Account";
    setHeaderProfile({
      displayName,
      initials: computeInitials(u.firstName, u.lastName, u.email),
      photoUrl: normalizedPhotoUrl(u.avatarUrl),
    });
    setViewer({
      initials: computeInitials(u.firstName, u.lastName, u.email),
      seed: displayName,
      photoUrl: normalizedPhotoUrl(u.avatarUrl),
    });
  }, []);

  const loadSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { user?: MeUser };
      const u = data.user;
      if (!u) return false;
      applyMeUser(u);
      return true;
    } catch {
      return false;
    }
  }, [applyMeUser]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await loadSession();
      if (cancelled) return;
      if (!ok) window.location.replace("/login");
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  useEffect(() => {
    const refetch = () => {
      void loadSession();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refetch();
    };
    window.addEventListener(BUDDY_AVATAR_UPDATED_EVENT, refetch);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener(BUDDY_AVATAR_UPDATED_EVENT, refetch);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [loadSession]);

  return (
    <>
      <FeedMarkup
        layoutClassName={layoutClassName}
        notifyDropdownClassName={notifyDropdownClassName}
        profileDropdownClassName={profileDropdownClassName}
        headerProfile={headerProfile}
        onDarkModeClick={toggleDark}
        onNotifyClick={toggleNotify}
        onProfileToggleClick={toggleProfile}
        onLogoutClick={() => void handleLogout()}
        composerSlot={
          <FeedComposer
            onPostCreated={(post) => setRecentCreatedPost(post)}
            userAvatar={{
              isLoading: headerProfile === null,
              photoUrl: headerProfile?.photoUrl ?? null,
              initials: headerProfile?.initials ?? "?",
              seed: headerProfile?.displayName ?? "user",
            }}
          />
        }
        feedPostsSlot={<FunctionalPostFeed viewer={viewer} prependPost={recentCreatedPost} />}
      />
      <Script src="/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
    </>
  );
}
