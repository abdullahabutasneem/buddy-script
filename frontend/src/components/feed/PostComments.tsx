"use client";

import { useCallback, useState } from "react";
import { LikerList } from "./LikerList";

type CommentAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type NestedComment = {
  id: string;
  postId: string;
  parentCommentId: string | null;
  text: string;
  createdAt: string;
  author: CommentAuthor;
  likeCount: number;
  likedByMe: boolean;
  likedByUsers: CommentAuthor[];
  replies: NestedComment[];
};

function normalizeComment(c: NestedComment): NestedComment {
  return {
    ...c,
    likeCount: typeof c.likeCount === "number" ? c.likeCount : 0,
    likedByMe: Boolean(c.likedByMe),
    likedByUsers: Array.isArray(c.likedByUsers) ? c.likedByUsers : [],
    replies: (c.replies ?? []).map(normalizeComment),
  };
}

function countComments(nodes: NestedComment[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countComments(n.replies), 0);
}

function patchCommentTree(
  nodes: NestedComment[],
  id: string,
  patch: Partial<
    Pick<NestedComment, "likeCount" | "likedByMe" | "likedByUsers">
  >,
): NestedComment[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, ...patch };
    if (n.replies.length === 0) return n;
    return { ...n, replies: patchCommentTree(n.replies, id, patch) };
  });
}

type PostCommentsProps = {
  postId: string;
};

export function PostComments({ postId }: PostCommentsProps) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<NestedComment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [topText, setTopText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);
  const [commentLikeBusy, setCommentLikeBusy] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        comments?: NestedComment[];
        error?: string;
      };
      if (!res.ok) {
        setLoadError(data.error ?? "Could not load comments");
        setComments([]);
        return;
      }
      setComments((data.comments ?? []).map(normalizeComment));
    } catch {
      setLoadError("Network error");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && comments === null) {
      await loadComments();
    }
  }

  async function submitComment(parentCommentId: string | null, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          ...(parentCommentId ? { parentCommentId } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setLoadError(data.error ?? "Could not post comment");
        return;
      }
      setTopText("");
      setReplyText("");
      setReplyToId(null);
      await loadComments();
    } finally {
      setSubmitBusy(false);
    }
  }

  async function toggleCommentLike(node: NestedComment) {
    if (commentLikeBusy !== null) return;
    setCommentLikeBusy(node.id);
    const method = node.likedByMe ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/comments/${node.id}/like`, {
        method,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        likeCount?: number;
        likedByMe?: boolean;
        likedByUsers?: CommentAuthor[];
      };
      if (!res.ok) return;
      if (typeof data.likeCount !== "number" || typeof data.likedByMe !== "boolean") return;
      const likedByUsers = Array.isArray(data.likedByUsers) ? data.likedByUsers : [];
      setComments((prev) => {
        if (!prev) return prev;
        return patchCommentTree(prev, node.id, {
          likeCount: data.likeCount!,
          likedByMe: data.likedByMe!,
          likedByUsers,
        });
      });
    } finally {
      setCommentLikeBusy(null);
    }
  }

  const totalLabel =
    comments !== null ? ` (${countComments(comments)})` : "";

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => void handleOpen()}
        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        {open ? "Hide comments" : "Comments"}
        {!open ? totalLabel : comments !== null ? totalLabel : ""}
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          {loadError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
          ) : null}
          {loading ? (
            <p className="text-sm text-zinc-500">Loading comments…</p>
          ) : comments !== null ? (
            <>
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitComment(null, topText);
                }}
              >
                <label className="sr-only" htmlFor={`buddy-comment-top-${postId}`}>
                  New comment
                </label>
                <textarea
                  id={`buddy-comment-top-${postId}`}
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Write a comment…"
                  className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                />
                <button
                  type="submit"
                  disabled={submitBusy || !topText.trim()}
                  className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {submitBusy ? "Posting…" : "Comment"}
                </button>
              </form>

              {comments.length === 0 ? (
                <p className="text-sm text-zinc-500">No comments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {comments.map((n) => (
                    <CommentBranch
                      key={n.id}
                      node={n}
                      depth={0}
                      replyToId={replyToId}
                      setReplyToId={setReplyToId}
                      replyText={replyText}
                      setReplyText={setReplyText}
                      submitBusy={submitBusy}
                      onSubmitReply={(parentId, t) => void submitComment(parentId, t)}
                      onToggleLike={(c) => void toggleCommentLike(c)}
                      commentLikeBusy={commentLikeBusy}
                    />
                  ))}
                </ul>
              )}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CommentBranch({
  node,
  depth,
  replyToId,
  setReplyToId,
  replyText,
  setReplyText,
  submitBusy,
  onSubmitReply,
  onToggleLike,
  commentLikeBusy,
}: {
  node: NestedComment;
  depth: number;
  replyToId: string | null;
  setReplyToId: (id: string | null) => void;
  replyText: string;
  setReplyText: (t: string) => void;
  submitBusy: boolean;
  onSubmitReply: (parentId: string, text: string) => void;
  onToggleLike: (c: NestedComment) => void;
  commentLikeBusy: string | null;
}) {
  const pad = Math.min(depth, 6) * 12;

  return (
    <li className="list-none">
      <div
        className="rounded border border-zinc-100 bg-zinc-50/80 p-2 dark:border-zinc-700 dark:bg-zinc-800/50"
        style={{ marginLeft: pad }}
      >
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {node.author.firstName} {node.author.lastName} ·{" "}
          {new Date(node.createdAt).toLocaleString()}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm">{node.text}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={commentLikeBusy !== null}
            onClick={() => onToggleLike(node)}
            className={`rounded px-2 py-0.5 text-xs font-medium disabled:opacity-50 ${
              node.likedByMe
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600"
            }`}
          >
            {node.likedByMe ? "Unlike" : "Like"}
          </button>
          <span className="text-xs text-zinc-500">
            {node.likeCount} {node.likeCount === 1 ? "like" : "likes"}
          </span>
          <button
            type="button"
            onClick={() => {
              setReplyToId(replyToId === node.id ? null : node.id);
              setReplyText("");
            }}
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Reply
          </button>
        </div>
        <LikerList users={node.likedByUsers} />

        {replyToId === node.id ? (
          <form
            className="mt-2 space-y-2 border-t border-zinc-200 pt-2 dark:border-zinc-600"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitReply(node.id, replyText);
            }}
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Write a reply…"
              className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitBusy || !replyText.trim()}
                className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
              >
                {submitBusy ? "…" : "Post reply"}
              </button>
              <button
                type="button"
                onClick={() => setReplyToId(null)}
                className="text-xs text-zinc-600 hover:underline dark:text-zinc-400"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {node.replies.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {node.replies.map((r) => (
            <CommentBranch
              key={r.id}
              node={r}
              depth={depth + 1}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              replyText={replyText}
              setReplyText={setReplyText}
              submitBusy={submitBusy}
              onSubmitReply={onSubmitReply}
              onToggleLike={onToggleLike}
              commentLikeBusy={commentLikeBusy}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
