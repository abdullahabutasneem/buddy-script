"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizedPhotoUrl } from "@/lib/resolveAvatarUrl";
import { computeInitials } from "@/lib/userInitials";
import type { FeedPost } from "./feedTypes";
import { TimelinePostCard, type FeedViewerBrief } from "./TimelinePostCard";

export type { FeedPost } from "./feedTypes";

const FEED_PAGE_SIZE = 20;

function byNewestFirst(a: FeedPost, b: FeedPost): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function normalizePost(p: FeedPost): FeedPost {
  return {
    ...p,
    visibility: p.visibility === "private" ? "private" : "public",
    likeCount: typeof p.likeCount === "number" ? p.likeCount : 0,
    likedByMe: Boolean(p.likedByMe),
    likedByUsers: Array.isArray(p.likedByUsers) ? p.likedByUsers : [],
    commentCount: typeof p.commentCount === "number" ? p.commentCount : 0,
    isAuthor: Boolean(p.isAuthor),
  };
}

type FeedApiResponse = {
  posts?: FeedPost[];
  nextCursor?: string | null;
  hasMore?: boolean;
  error?: string;
};

type FunctionalPostFeedProps = {
  refreshNonce?: number;
};

export function FunctionalPostFeed({ refreshNonce = 0 }: FunctionalPostFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<FeedViewerBrief>(null);

  const loadFirstPage = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(FEED_PAGE_SIZE));
      const res = await fetch(`/api/posts?${params.toString()}`, {
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as FeedApiResponse;
      if (!res.ok) {
        setLoadError(data.error ?? "Could not load posts");
        setPosts([]);
        setNextCursor(null);
        setHasMore(false);
        return;
      }
      const list = (data.posts ?? []).map(normalizePost);
      setPosts([...list].sort(byNewestFirst));
      setNextCursor(
        typeof data.nextCursor === "string" && data.nextCursor.length > 0
          ? data.nextCursor
          : null,
      );
      setHasMore(Boolean(data.hasMore));
    } catch {
      setLoadError("Network error");
      setPosts([]);
      setNextCursor(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage, refreshNonce]);

  const loadMore = useCallback(async () => {
    if (nextCursor == null || !hasMore || loadingMore) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(FEED_PAGE_SIZE));
      params.set("cursor", nextCursor);
      const res = await fetch(`/api/posts?${params.toString()}`, {
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as FeedApiResponse;
      if (!res.ok) {
        setLoadError(data.error ?? "Could not load more posts");
        return;
      }
      const list = (data.posts ?? []).map(normalizePost);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const p of list.sort(byNewestFirst)) {
          if (!seen.has(p.id)) {
            seen.add(p.id);
            merged.push(p);
          }
        }
        return merged.sort(byNewestFirst);
      });
      setNextCursor(
        typeof data.nextCursor === "string" && data.nextCursor.length > 0
          ? data.nextCursor
          : null,
      );
      setHasMore(Boolean(data.hasMore));
    } catch {
      setLoadError("Network error");
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, hasMore, loadingMore]);

  const refreshCommentCount = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/stats`, {
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        commentCount?: number;
      };
      if (!res.ok || typeof data.commentCount !== "number") return;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentCount: data.commentCount! } : p,
        ),
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          user?: {
            firstName?: string;
            lastName?: string;
            email?: string;
            avatarUrl?: string | null;
          };
        };
        const u = data.user;
        if (!u || cancelled) return;
        const displayName =
          [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
          u.email ||
          "Account";
        setViewer({
          initials: computeInitials(u.firstName, u.lastName, u.email),
          seed: displayName,
          photoUrl: normalizedPhotoUrl(u.avatarUrl),
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleLike(post: FeedPost) {
    if (likeBusyId !== null) return;
    setLikeBusyId(post.id);
    const method = post.likedByMe ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        likeCount?: number;
        likedByMe?: boolean;
        likedByUsers?: FeedPost["likedByUsers"];
      };
      if (!res.ok) return;
      if (typeof data.likeCount !== "number" || typeof data.likedByMe !== "boolean") return;
      const likedByUsers = Array.isArray(data.likedByUsers) ? data.likedByUsers : [];
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                likeCount: data.likeCount!,
                likedByMe: data.likedByMe!,
                likedByUsers,
              }
            : p,
        ),
      );
    } finally {
      setLikeBusyId(null);
    }
  }

  return (
    <section className="_buddy_functional_post_feed _mar_b16" aria-label="Feed posts">
      <h3 className="_right_inner_area_info_content_title _title5 _mar_b16">Posts</h3>
      {loading ? (
        <p className="_feed_inner_timeline_post_box_para">Loading…</p>
      ) : loadError ? (
        <p className="_feed_inner_timeline_post_box_para" style={{ color: "#c62828" }}>
          {loadError}
        </p>
      ) : posts.length === 0 ? (
        <p className="_feed_inner_timeline_post_box_para">No posts yet. Be the first to post.</p>
      ) : (
        <>
          <ul className="list-unstyled p-0 m-0">
            {posts.map((p) => (
              <TimelinePostCard
                key={p.id}
                post={p}
                likeBusy={likeBusyId !== null}
                onToggleLike={(post) => void toggleLike(post)}
                onPostDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
                onCommentsChanged={(pid) => void refreshCommentCount(pid)}
                viewer={viewer}
              />
            ))}
          </ul>
          {hasMore ? (
            <div className="_mar_t16 _mar_b8">
              <button
                type="button"
                className="_social_login_form_btn_link _btn1"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? "Loading…" : "Load more posts"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
