"use client";

import { useCallback, useEffect, useState } from "react";

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
};

export function FunctionalPostFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      setPosts(data.posts ?? []);
    } catch {
      setLoadError("Network error");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    const form = e.currentTarget;
    const text = (form.elements.namedItem("text") as HTMLTextAreaElement).value;
    const imageInput = form.elements.namedItem("image") as HTMLInputElement;
    const file = imageInput.files?.[0];

    if (!text.trim() && !file) {
      setSubmitError("Enter text or choose an image");
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("text", text);
      if (file) body.append("image", file);

      const res = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = (await res.json().catch(() => ({}))) as {
        post?: FeedPost;
        error?: string;
      };
      if (!res.ok) {
        setSubmitError(data.error ?? "Could not create post");
        return;
      }
      if (data.post) {
        setPosts((prev) => [data.post!, ...prev]);
      }
      form.reset();
    } catch {
      setSubmitError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="buddy-feed-functional rounded-md border border-solid border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
      <h2 className="mb-3 text-lg font-semibold">Your feed</h2>

      <form onSubmit={onSubmit} className="mb-6 space-y-3">
        {submitError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {submitError}
          </p>
        ) : null}
        <label className="block text-sm font-medium" htmlFor="buddy-post-text">
          Text
        </label>
        <textarea
          id="buddy-post-text"
          name="text"
          rows={3}
          maxLength={5000}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="What’s on your mind?"
        />
        <label className="block text-sm font-medium" htmlFor="buddy-post-image">
          Image (optional)
        </label>
        <input
          id="buddy-post-image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="block w-full text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </form>

      <h3 className="mb-2 text-base font-semibold">All posts (newest first)</h3>
      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : loadError ? (
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-zinc-500">No posts yet. Be the first to post.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((p) => (
            <li
              key={p.id}
              className="rounded border border-zinc-200 p-3 dark:border-zinc-700"
            >
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {p.author.firstName} {p.author.lastName} ·{" "}
                {new Date(p.createdAt).toLocaleString()}
              </p>
              {p.text ? <p className="mt-2 whitespace-pre-wrap text-sm">{p.text}</p> : null}
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt=""
                  className="mt-2 max-h-80 w-full max-w-md rounded object-contain"
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
