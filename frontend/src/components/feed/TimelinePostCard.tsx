/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { computeInitials } from "@/lib/userInitials";
import type { FeedPost } from "./feedTypes";
import { PostComments } from "./PostComments";

export type FeedViewerBrief = {
  initials: string;
  seed: string;
  photoUrl: string | null;
} | null;

type TimelinePostCardProps = {
  post: FeedPost;
  likeBusy: boolean;
  onToggleLike: (post: FeedPost) => void;
  onPostDeleted: (postId: string) => void;
  onCommentsChanged?: (postId: string) => void;
  viewer: FeedViewerBrief;
};

export function TimelinePostCard({
  post,
  likeBusy,
  onToggleLike,
  onPostDeleted,
  onCommentsChanged,
  viewer,
}: TimelinePostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const authorName = `${post.author.firstName} ${post.author.lastName}`.trim();
  const authorInitials = computeInitials(
    post.author.firstName,
    post.author.lastName,
    post.author.email,
  );
  const authorSeed = authorName || post.author.email;

  useEffect(() => {
    if (!menuOpen) return;
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const deletePost = useCallback(async () => {
    if (!post.isAuthor || deleteBusy) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) onPostDeleted(post.id);
    } finally {
      setDeleteBusy(false);
      setMenuOpen(false);
    }
  }, [post.id, post.isAuthor, deleteBusy, onPostDeleted]);

  const likersToShow = post.likedByUsers.slice(0, 4);
  const likerOverflow =
    post.likeCount > likersToShow.length ? post.likeCount - likersToShow.length : 0;

  return (
    <li className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16 list-unstyled">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              <InitialsAvatar
                initials={authorInitials}
                seed={authorSeed}
                sizePx={44}
                className="_post_img"
              />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">{authorName}</h4>
              <p className="_feed_inner_timeline_post_box_para">
                {formatRelativeTime(post.createdAt)} .{" "}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  {post.visibility === "private" ? "Only me" : "Public"}
                </a>
              </p>
            </div>
          </div>
          <div className="_feed_inner_timeline_post_box_dropdown" ref={menuRef}>
            <div className="_feed_timeline_post_dropdown">
              <button
                type="button"
                className="_feed_timeline_post_dropdown_link"
                aria-expanded={menuOpen}
                aria-haspopup="true"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
                  <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                </svg>
              </button>
            </div>
            <div
              className={`_feed_timeline_dropdown _timeline_dropdown${menuOpen ? " show" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <ul className="_feed_timeline_dropdown_list list-unstyled">
                <li className="_feed_timeline_dropdown_item">
                  <span className="_feed_timeline_dropdown_link" style={{ cursor: "default" }}>
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                        <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 15.75L9 12l-5.25 3.75v-12a1.5 1.5 0 011.5-1.5h7.5a1.5 1.5 0 011.5 1.5v12z" />
                      </svg>
                    </span>
                    Save post
                  </span>
                </li>
                {post.isAuthor ? (
                  <li className="_feed_timeline_dropdown_item">
                    <button
                      type="button"
                      className="_feed_timeline_dropdown_link border-0 bg-transparent p-0 text-start w-100"
                      disabled={deleteBusy}
                      onClick={() => void deletePost()}
                    >
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                          <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5zM7.5 8.25v4.5M10.5 8.25v4.5" />
                        </svg>
                      </span>
                      Delete post
                    </button>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>
        {post.text ? (
          <h4 className="_feed_inner_timeline_post_title" style={{ whiteSpace: "pre-wrap" }}>
            {post.text}
          </h4>
        ) : null}
        {post.imageUrl ? (
          <div className="_feed_inner_timeline_image">
            <img src={post.imageUrl} alt="" className="_time_img img-fluid w-100" />
          </div>
        ) : null}
      </div>

      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div className="_buddy_liker_pile _feed_inner_timeline_total_reacts_image">
          {likersToShow.map((u, i) => (
            <InitialsAvatar
              key={u.id}
              initials={computeInitials(u.firstName, u.lastName, u.email)}
              seed={`${u.firstName}${u.lastName}${u.email}`}
              sizePx={32}
              className={i === 0 ? "_react_img1" : "_react_img"}
            />
          ))}
          {likerOverflow > 0 ? (
            <p className="_feed_inner_timeline_total_reacts_para">{likerOverflow}+</p>
          ) : null}
        </div>
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <button
              type="button"
              className="border-0 bg-transparent p-0"
              style={{ cursor: "pointer" }}
              onClick={() => setShowThread(true)}
            >
              <span>{post.commentCount}</span> Comment
              {post.commentCount === 1 ? "" : "s"}
            </button>
          </p>
          <p className="_feed_inner_timeline_total_reacts_para2">
            <span>0</span> Share
          </p>
        </div>
      </div>

      <div className="_feed_inner_timeline_reaction">
        <button
          type="button"
          className={`_feed_inner_timeline_reaction_emoji _feed_reaction${post.likedByMe ? " _feed_reaction_active" : ""}`}
          disabled={likeBusy}
          onClick={() => onToggleLike(post)}
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                {post.likedByMe ? (
                  <path
                    fill="#1877F2"
                    d="M1 21h4V9H1v12zm22.73-11.89l-1.14-2.26A2 2 0 0 0 19.86 6H16V4.5a2.5 2.5 0 0 0-5 0V6H7.14a2 2 0 0 0-1.73 1L4.27 10.11A2 2 0 0 0 5 13v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0 .27-1.11z"
                  />
                ) : (
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                  />
                )}
              </svg>
              Like
            </span>
          </span>
        </button>
        <button
          type="button"
          className="_feed_inner_timeline_reaction_comment _feed_reaction"
          onClick={() => setShowThread(true)}
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="none" viewBox="0 0 21 21">
                <path stroke="#000" d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z" />
                <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" d="M6.938 9.313h7.125M10.5 14.063h3.563" />
              </svg>
              Comment
            </span>
          </span>
        </button>
        <button type="button" className="_feed_inner_timeline_reaction_share _feed_reaction" disabled>
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="24" height="21" fill="none" viewBox="0 0 24 21">
                <path stroke="#000" strokeLinejoin="round" d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z" />
              </svg>
              Share
            </span>
          </span>
        </button>
      </div>

      <PostComments
        postId={post.id}
        commentCount={post.commentCount}
        threadExpanded={showThread}
        onExpandThread={() => setShowThread(true)}
        viewer={viewer}
        onCommentsChanged={onCommentsChanged}
      />
    </li>
  );
}
