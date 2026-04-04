"use client";

import { useCallback, useEffect, useState } from "react";
import Script from "next/script";
import { normalizedPhotoUrl } from "@/lib/resolveAvatarUrl";
import { computeInitials } from "@/lib/userInitials";
import { FeedComposer } from "./FeedComposer";
import { FeedMarkup, type FeedHeaderProfile } from "./FeedMarkup";
import { FunctionalPostFeed } from "./FunctionalPostFeed";

export function FeedClient() {
  const [sessionReady, setSessionReady] = useState(false);
  const [headerProfile, setHeaderProfile] = useState<FeedHeaderProfile | null>(
    null,
  );
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          window.location.replace("/login");
          return;
        }
        const data = (await res.json()) as {
          user?: {
            firstName?: string;
            lastName?: string;
            email?: string;
            avatarUrl?: string | null;
          };
        };
        const u = data.user;
        if (!u || cancelled) {
          window.location.replace("/login");
          return;
        }
        const displayName =
          [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
          u.email ||
          "Account";
        setHeaderProfile({
          displayName,
          initials: computeInitials(u.firstName, u.lastName, u.email),
          photoUrl: normalizedPhotoUrl(u.avatarUrl),
        });
        setSessionReady(true);
      } catch {
        if (!cancelled) window.location.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!sessionReady) {
    return (
      <div className="_layout _layout_main_wrapper _padd_t40 _padd_b40">
        <p className="_feed_inner_timeline_post_box_para text-center">Loading…</p>
      </div>
    );
  }

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
            onPostCreated={() => setFeedRefreshKey((k) => k + 1)}
            userAvatar={{
              isLoading: headerProfile === null,
              photoUrl: headerProfile?.photoUrl ?? null,
              initials: headerProfile?.initials ?? "?",
              seed: headerProfile?.displayName ?? "user",
            }}
          />
        }
        feedPostsSlot={<FunctionalPostFeed refreshNonce={feedRefreshKey} />}
      />
      <Script src="/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
    </>
  );
}
