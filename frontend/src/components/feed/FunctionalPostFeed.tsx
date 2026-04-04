"use client";

import { useCallback, useEffect, useState } from "react";
import { LikerList } from "./LikerList";
import { PostComments } from "./PostComments";

type Author = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type FeedPost = {
  id: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  author: Author;
  visibility: "public" | "private";
  likeCount: number;
  likedByMe: boolean;
  likedByUsers: Author[];
};

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
  };
}

type FunctionalPostFeedProps = {
  /** Increment to refetch posts (e.g. after creating a post) without remounting the tree. */
  refreshNonce?: number;
};

export function FunctionalPostFeed({ refreshNonce = 0 }: FunctionalPostFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/posts", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        posts?: FeedPost[];
        error?: string;
      };
      if (!res.ok) {
        setLoadError(data.error ?? "Could not load posts");
        setPosts([]);
        return;
      }
      const list = (data.posts ?? []).map(normalizePost);
      setPosts([...list].sort(byNewestFirst));
    } catch {
      setLoadError("Network error");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts, refreshNonce]);

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
        likedByUsers?: Author[];
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
        <ul className="list-unstyled" style={{ marginBottom: 0 }}>
          {posts.map((p) => (
            <li
              key={p.id}
              className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16"
            >
              <p className="_feed_inner_timeline_post_box_para _mar_b8">
                {p.author.firstName} {p.author.lastName} · {new Date(p.createdAt).toLocaleString()}
                {p.visibility === "private" ? (
                  <span className="ms-2 text-uppercase" style={{ fontSize: "11px", fontWeight: 600 }}>
                    {" "}
                    · Private
                  </span>
                ) : null}
              </p>
              {p.text ? (
                <p className="_feed_inner_timeline_post_title _mar_b8" style={{ whiteSpace: "pre-wrap" }}>
                  {p.text}
                </p>
              ) : null}
              {p.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.imageUrl}
                  alt=""
                  className="img-fluid _mar_b8"
                  style={{ maxHeight: "320px", objectFit: "contain" }}
                />
              ) : null}
              <div className="_feed_inner_timeline_reaction _mar_t16 d-flex flex-wrap align-items-center gap-2">
                <button
                  type="button"
                  disabled={likeBusyId !== null}
                  onClick={() => void toggleLike(p)}
                  className={`btn btn-sm ${p.likedByMe ? "btn-primary" : "btn-outline-secondary"}`}
                >
                  {p.likedByMe ? "Unlike" : "Like"}
                </button>
                <span className="_feed_inner_timeline_post_box_para" style={{ marginBottom: 0 }}>
                  {p.likeCount} {p.likeCount === 1 ? "like" : "likes"}
                </span>
              </div>
              <LikerList users={p.likedByUsers} />
              <PostComments postId={p.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
