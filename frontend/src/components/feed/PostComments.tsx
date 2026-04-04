/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { computeInitials } from "@/lib/userInitials";

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

export type PostCommentsProps = {
  postId: string;
  commentCount: number;
  threadExpanded: boolean;
  onExpandThread: () => void;
  viewer: {
    initials: string;
    seed: string;
    photoUrl: string | null;
  } | null;
  onCommentsChanged?: () => void;
};

export function PostComments({
  postId,
  commentCount,
  threadExpanded,
  onExpandThread,
  viewer,
  onCommentsChanged,
}: PostCommentsProps) {
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

  useEffect(() => {
    if (!threadExpanded) return;
    void loadComments();
  }, [threadExpanded, postId, loadComments]);

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
      onCommentsChanged?.();
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

  return (
    <>
      <div className="_feed_inner_timeline_cooment_area">
        <div className="_feed_inner_comment_box">
          <form
            className="_feed_inner_comment_box_form"
            onSubmit={(e) => {
              e.preventDefault();
              void submitComment(null, topText);
            }}
          >
            <div className="_feed_inner_comment_box_content">
              <div className="_feed_inner_comment_box_content_image">
                {viewer?.photoUrl ? (
                  <img src={viewer.photoUrl} alt="" className="_comment_img" />
                ) : (
                  <InitialsAvatar
                    initials={viewer?.initials ?? "?"}
                    seed={viewer?.seed ?? "user"}
                    sizePx={26}
                    muted={!viewer}
                    className="_comment_img"
                  />
                )}
              </div>
              <div className="_feed_inner_comment_box_content_txt">
                <textarea
                  className="form-control _comment_textarea"
                  placeholder="Write a comment"
                  id={`buddy-comment-top-${postId}`}
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  maxLength={2000}
                  rows={1}
                />
              </div>
            </div>
            <div className="_feed_inner_comment_box_icon">
              <button type="button" className="_feed_inner_comment_box_icon_btn" aria-hidden tabIndex={-1}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path fill="#000" fillOpacity=".46" fillRule="evenodd" d="M13.167 6.534a.5.5 0 01.5.5c0 3.061-2.35 5.582-5.333 5.837V14.5a.5.5 0 01-1 0v-1.629C4.35 12.616 2 10.096 2 7.034a.5.5 0 011 0c0 2.679 2.168 4.859 4.833 4.859 2.666 0 4.834-2.18 4.834-4.86a.5.5 0 01.5-.5zM7.833.667a3.218 3.218 0 013.208 3.22v3.126c0 1.775-1.439 3.22-3.208 3.22a3.218 3.218 0 01-3.208-3.22V3.887c0-1.776 1.44-3.22 3.208-3.22zm0 1a2.217 2.217 0 00-2.208 2.22v3.126c0 1.223.991 2.22 2.208 2.22a2.217 2.217 0 002.208-2.22V3.887c0-1.224-.99-2.22-2.208-2.22z" clipRule="evenodd" />
                </svg>
              </button>
              <button type="button" className="_feed_inner_comment_box_icon_btn" aria-hidden tabIndex={-1}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path fill="#000" fillOpacity=".46" fillRule="evenodd" d="M10.867 1.333c2.257 0 3.774 1.581 3.774 3.933v5.435c0 2.352-1.517 3.932-3.774 3.932H5.101c-2.254 0-3.767-1.58-3.767-3.932V5.266c0-2.352 1.513-3.933 3.767-3.933h5.766zm0 1H5.101c-1.681 0-2.767 1.152-2.767 2.933v5.435c0 1.782 1.086 2.932 2.767 2.932h5.766c1.685 0 2.774-1.15 2.774-2.932V5.266c0-1.781-1.089-2.933-2.774-2.933zm.426 5.733l.017.015.013.013.009.008.037.037c.12.12.453.46 1.443 1.477a.5.5 0 11-.716.697S10.73 8.91 10.633 8.816a.614.614 0 00-.433-.118.622.622 0 00-.421.225c-1.55 1.88-1.568 1.897-1.594 1.922a1.456 1.456 0 01-2.057-.021s-.62-.63-.63-.642c-.155-.143-.43-.134-.594.04l-1.02 1.076a.498.498 0 01-.707.018.499.499 0 01-.018-.706l1.018-1.075c.54-.573 1.45-.6 2.025-.06l.639.647c.178.18.467.184.646.008l1.519-1.843a1.618 1.618 0 011.098-.584c.433-.038.854.088 1.19.363zM5.706 4.42c.921 0 1.67.75 1.67 1.67 0 .92-.75 1.67-1.67 1.67-.92 0-1.67-.75-1.67-1.67 0-.921.75-1.67 1.67-1.67zm0 1a.67.67 0 10.001 1.34.67.67 0 00-.002-1.34z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="_timline_comment_main">
        {commentCount > 0 && !threadExpanded ? (
          <div className="_previous_comment">
            <button type="button" className="_previous_comment_txt" onClick={onExpandThread}>
              View {commentCount} previous comment{commentCount === 1 ? "" : "s"}
            </button>
          </div>
        ) : null}

        {threadExpanded ? (
          <>
            {loadError ? (
              <p className="_feed_inner_timeline_post_box_para _mar_b8" style={{ color: "#c62828" }}>
                {loadError}
              </p>
            ) : null}
            {loading && comments === null ? (
              <p className="_feed_inner_timeline_post_box_para">Loading comments…</p>
            ) : null}
            {comments !== null && comments.length === 0 && !loading ? (
              <p className="_feed_inner_timeline_post_box_para">No comments yet.</p>
            ) : null}
            {comments !== null && comments.length > 0
              ? comments.map((n) => (
                  <CommentBranchTimeline
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
                ))
              : null}
          </>
        ) : null}
      </div>
    </>
  );
}

function CommentBranchTimeline({
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
  const pad = Math.min(depth, 8) * 16;
  const name = `${node.author.firstName} ${node.author.lastName}`.trim();
  const initials = computeInitials(
    node.author.firstName,
    node.author.lastName,
    node.author.email,
  );

  return (
    <div className="w-100">
      <div className="_comment_main" style={{ marginLeft: pad }}>
        <div className="_comment_image">
          <span className="_comment_image_link d-inline-block">
            <InitialsAvatar
              initials={initials}
              seed={name || node.author.email}
              sizePx={40}
              className="_comment_img1"
            />
          </span>
        </div>
        <div className="_comment_area">
          <div className="_comment_details">
            <div className="_comment_details_top">
              <div className="_comment_name">
                <h4 className="_comment_name_title">{name}</h4>
              </div>
            </div>
            <div className="_comment_status">
              <p className="_comment_status_text">
                <span style={{ whiteSpace: "pre-wrap" }}>{node.text}</span>
              </p>
            </div>
            {node.likeCount > 0 ? (
              <div className="_total_reactions">
                <div className="_total_react">
                  <span className="_reaction_like">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                  </span>
                </div>
                <span className="_total">{node.likeCount}</span>
              </div>
            ) : null}
            <div className="_comment_reply">
              <div className="_comment_reply_num">
                <ul className="_comment_reply_list list-unstyled d-flex flex-wrap">
                  <li>
                    <button
                      type="button"
                      className="border-0 bg-transparent p-0"
                      disabled={commentLikeBusy !== null}
                      onClick={() => onToggleLike(node)}
                    >
                      <span>{node.likedByMe ? "Unlike" : "Like"}</span>
                    </button>
                  </li>
                  <li>
                    <span>.</span>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="border-0 bg-transparent p-0"
                      onClick={() => {
                        setReplyToId(replyToId === node.id ? null : node.id);
                        setReplyText("");
                      }}
                    >
                      <span>Reply</span>
                    </button>
                  </li>
                  <li>
                    <span className="_time_link">{formatRelativeTime(node.createdAt)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {replyToId === node.id ? (
            <div className="_feed_inner_comment_box _mar_t16">
              <form
                className="_feed_inner_comment_box_form"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmitReply(node.id, replyText);
                }}
              >
                <div className="_feed_inner_comment_box_content">
                  <div className="_feed_inner_comment_box_content_txt" style={{ flex: 1 }}>
                    <textarea
                      className="form-control _comment_textarea"
                      placeholder="Write a reply"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      maxLength={2000}
                      rows={1}
                    />
                  </div>
                </div>
                <div className="d-flex gap-2 justify-content-end w-100 mt-1">
                  <button
                    type="button"
                    className="border-0 bg-transparent _feed_inner_timeline_post_box_para"
                    onClick={() => setReplyToId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="_feed_inner_text_area_btn_link"
                    style={{ padding: "8px 16px", fontSize: 14 }}
                    disabled={submitBusy || !replyText.trim()}
                  >
                    {submitBusy ? "…" : "Reply"}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      </div>
      {node.replies.map((r) => (
        <CommentBranchTimeline
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
    </div>
  );
}
