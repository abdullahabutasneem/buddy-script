"use client";

import { useCallback, useState } from "react";
import Script from "next/script";
import { FeedMarkup } from "./FeedMarkup";
import { FunctionalPostFeed } from "./FunctionalPostFeed";

export function FeedClient() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

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

  const toggleTimeline = useCallback(() => {
    setTimelineOpen((o) => !o);
  }, []);

  const layoutClassName = `_layout _layout_main_wrapper${darkMode ? " _dark_wrapper" : ""}`;
  const notifyDropdownClassName = `_notification_dropdown${notifyOpen ? " show" : ""}`;
  const profileDropdownClassName = `_nav_profile_dropdown _profile_dropdown${profileOpen ? " show" : ""}`;
  const timelineDropdownClassName = `_feed_timeline_dropdown _timeline_dropdown${timelineOpen ? " show" : ""}`;

  return (
    <>
      <FeedMarkup
        layoutClassName={layoutClassName}
        notifyDropdownClassName={notifyDropdownClassName}
        profileDropdownClassName={profileDropdownClassName}
        timelineDropdownClassName={timelineDropdownClassName}
        onDarkModeClick={toggleDark}
        onNotifyClick={toggleNotify}
        onProfileToggleClick={toggleProfile}
        onTimelineToggleClick={toggleTimeline}
        functionalFeed={<FunctionalPostFeed />}
      />
      <Script src="/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
    </>
  );
}
