import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/requireAuth.js";
import { Comment } from "../models/Comment.js";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { decodeFeedCursor, encodeFeedCursor } from "../utils/feedCursor.js";
import {
  likeEngagement,
  likeEngagementForFeed,
  userIdsEqual,
  type AuthorPublic,
} from "../utils/likes.js";
import { POSTS_UPLOAD_DIR } from "../config/uploadsPaths.js";
import {
  destroyCloudinaryAssetByUrl,
  isCloudImageStorageEnabled,
  unlinkQuietly,
  uploadImageFileToCloudinary,
} from "../utils/cloudinaryStorage.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, POSTS_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".bin";
    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    cb(null, `${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|pjpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, ok);
  },
});

const router = Router();

function uploadImageOptional(req: Request, res: Response, next: NextFunction) {
  upload.single("image")(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Image too large (max 5MB)" });
      return;
    }
    res.status(400).json({
      error: "Invalid image (use JPEG, PNG, GIF, or WebP)",
    });
  });
}

type AuthorShape = {
  _id: unknown;
  firstName: string;
  lastName: string;
  email: string;
};

function serializeAuthor(author: AuthorShape) {
  return {
    id: String(author._id),
    firstName: author.firstName,
    lastName: author.lastName,
    email: author.email,
  };
}

function imagePublicUrl(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (stored.startsWith("https://") || stored.startsWith("http://")) return stored;
  return `/uploads/posts/${stored}`;
}

type LeanPost = {
  _id: unknown;
  text: string;
  imageFilename: string | null;
  createdAt: Date;
  author: unknown;
  likedBy?: unknown[];
  visibility?: string;
};

/** Viewer can see post if it is not private, or they are the author. */
function postVisibilityMatch(viewerId: string) {
  return {
    $or: [{ author: viewerId }, { visibility: { $ne: "private" } }],
  };
}

const FEED_DEFAULT_LIMIT = 20;
const FEED_MAX_LIMIT = 50;
/** Resolve at most this many liker profiles per post on the feed (UI shows fewer). */
const FEED_LIKER_PREVIEW = 8;

function parseFeedLimit(raw: unknown): number {
  const q = Array.isArray(raw) ? raw[0] : raw;
  const n = typeof q === "string" ? parseInt(q, 10) : Number.NaN;
  if (!Number.isFinite(n) || n < 1) return FEED_DEFAULT_LIMIT;
  return Math.min(n, FEED_MAX_LIMIT);
}

function serializePost(
  p: LeanPost,
  userId: string,
  commentCount = 0,
  feedLikerPreview?: AuthorPublic[],
) {
  const authorRaw = p.author as AuthorShape | null;
  const author =
    authorRaw && authorRaw._id != null
      ? serializeAuthor(authorRaw)
      : {
          id: "",
          firstName: "Unknown",
          lastName: "user",
          email: "",
        };
  const visibility = p.visibility === "private" ? "private" : "public";
  const isAuthor =
    authorRaw != null &&
    authorRaw._id != null &&
    userIdsEqual(String(authorRaw._id), userId);
  const engagement =
    feedLikerPreview !== undefined
      ? likeEngagementForFeed(
          p.likedBy as unknown[] | undefined,
          userId,
          feedLikerPreview,
        )
      : likeEngagement(p.likedBy, userId);
  return {
    id: String(p._id),
    text: p.text,
    imageUrl: imagePublicUrl(p.imageFilename),
    createdAt: p.createdAt,
    author,
    visibility,
    isAuthor,
    commentCount,
    ...engagement,
  };
}

type LeanCommentDoc = {
  _id: unknown;
  parentComment?: unknown;
  text: string;
  createdAt: Date;
  author: unknown;
  likedBy?: unknown[];
};

type FlatComment = {
  id: string;
  postId: string;
  parentCommentId: string | null;
  text: string;
  createdAt: Date;
  author: ReturnType<typeof serializeAuthor>;
  likeCount: number;
  likedByMe: boolean;
  likedByUsers: AuthorPublic[];
};

type NestedComment = FlatComment & { replies: NestedComment[] };

function serializeCommentRow(
  c: LeanCommentDoc,
  userId: string,
  postId: string,
): FlatComment {
  const authorRaw = c.author as AuthorShape | null;
  const author =
    authorRaw && authorRaw._id != null
      ? serializeAuthor(authorRaw)
      : {
          id: "",
          firstName: "Unknown",
          lastName: "user",
          email: "",
        };
  const parent = c.parentComment;
  const parentCommentId =
    parent != null && parent !== undefined ? String(parent) : null;
  return {
    id: String(c._id),
    postId,
    parentCommentId,
    text: c.text,
    createdAt: c.createdAt,
    author,
    ...likeEngagement(c.likedBy, userId),
  };
}

function nestCommentTree(flat: FlatComment[]): NestedComment[] {
  const map = new Map<string, NestedComment>();
  for (const row of flat) {
    map.set(row.id, { ...row, replies: [] });
  }
  const roots: NestedComment[] = [];
  for (const row of flat) {
    const node = map.get(row.id)!;
    const pid = row.parentCommentId;
    if (!pid) {
      roots.push(node);
      continue;
    }
    const parent = map.get(pid);
    if (parent) {
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  const byNewest = (a: NestedComment, b: NestedComment) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  const byOldest = (a: NestedComment, b: NestedComment) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  roots.sort(byNewest);
  const sortReplies = (node: NestedComment) => {
    node.replies.sort(byOldest);
    node.replies.forEach(sortReplies);
  };
  roots.forEach(sortReplies);
  return roots;
}

router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const limit = parseFeedLimit(req.query.limit);
  const cursorPayload = decodeFeedCursor(req.query.cursor);

  const visibility = postVisibilityMatch(userId);
  const filter: Record<string, unknown> = cursorPayload
    ? {
        $and: [
          visibility,
          {
            $or: [
              { createdAt: { $lt: new Date(cursorPayload.t) } },
              {
                createdAt: new Date(cursorPayload.t),
                _id: { $lt: new mongoose.Types.ObjectId(cursorPayload.i) },
              },
            ],
          },
        ],
      }
    : visibility;

  const rawPosts = await Post.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate("author", "firstName lastName email")
    .lean();

  const hasMore = rawPosts.length > limit;
  const page = hasMore ? rawPosts.slice(0, limit) : rawPosts;

  const likerIdSet = new Set<string>();
  for (const p of page) {
    const arr = (p as { likedBy?: unknown[] }).likedBy ?? [];
    for (let i = 0; i < Math.min(arr.length, FEED_LIKER_PREVIEW); i++) {
      likerIdSet.add(String(arr[i]));
    }
  }
  const likerIds = [...likerIdSet].filter((id) => mongoose.isValidObjectId(id));
  const likerDocs =
    likerIds.length > 0
      ? await User.find({
          _id: { $in: likerIds.map((id) => new mongoose.Types.ObjectId(id)) },
        })
          .select("firstName lastName email")
          .lean()
      : [];
  const likerMap = new Map(
    likerDocs.map((u) => [String(u._id), u as unknown as AuthorShape]),
  );

  function likerPreviewForPost(p: (typeof page)[0]): AuthorPublic[] {
    const arr = (p as { likedBy?: unknown[] }).likedBy ?? [];
    const out: AuthorPublic[] = [];
    for (let i = 0; i < Math.min(arr.length, FEED_LIKER_PREVIEW); i++) {
      const id = String(arr[i]);
      const u = likerMap.get(id);
      out.push(
        u && u._id != null
          ? serializeAuthor(u)
          : { id, firstName: "Unknown", lastName: "user", email: "" },
      );
    }
    return out;
  }

  const ids = page.map((p) => p._id);
  const countMap = new Map<string, number>();
  if (ids.length > 0) {
    const counts = await Comment.aggregate<{ _id: unknown; count: number }>([
      { $match: { post: { $in: ids } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]);
    for (const row of counts) {
      countMap.set(String(row._id), row.count);
    }
  }

  const lastRaw = page[page.length - 1] as unknown;
  const last =
    lastRaw != null &&
    typeof lastRaw === "object" &&
    "createdAt" in lastRaw &&
    "_id" in lastRaw
      ? (lastRaw as { _id: mongoose.Types.ObjectId; createdAt: Date })
      : undefined;
  const nextCursor =
    hasMore && last != null
      ? encodeFeedCursor(last.createdAt, last._id)
      : null;

  res.json({
    posts: page.map((p) =>
      serializePost(
        p as unknown as LeanPost,
        userId,
        countMap.get(String(p._id)) ?? 0,
        likerPreviewForPost(p),
      ),
    ),
    nextCursor,
    hasMore,
  });
});

router.get("/:postId/stats", requireAuth, async (req, res) => {
  const postId = paramId(req.params.postId);
  const userId = req.userId!;
  if (!postId || !mongoose.isValidObjectId(postId)) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }
  const post = await Post.findOne({
    _id: postId,
    ...postVisibilityMatch(userId),
  })
    .select("_id")
    .lean();
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const commentCount = await Comment.countDocuments({ post: postId });
  res.json({ commentCount });
});

router.post("/", requireAuth, uploadImageOptional, async (req, res) => {
  const raw = req.body?.text;
  const text = typeof raw === "string" ? raw.trim() : "";
  const file = req.file;

  if (!text && !file) {
    res.status(400).json({ error: "Add some text or an image" });
    return;
  }

  if (text.length > 5000) {
    res.status(400).json({ error: "Text is too long (max 5000 characters)" });
    return;
  }

  const visRaw = req.body?.visibility;
  const visibility =
    visRaw === "private" || visRaw === "public" ? visRaw : "public";

  let imageStored: string | null = null;
  if (file) {
    if (isCloudImageStorageEnabled()) {
      try {
        const { secureUrl } = await uploadImageFileToCloudinary(
          file.path,
          "buddy-script/posts",
        );
        imageStored = secureUrl;
      } catch {
        unlinkQuietly(file.path);
        res.status(500).json({ error: "Could not upload image" });
        return;
      }
      unlinkQuietly(file.path);
    } else {
      imageStored = file.filename;
    }
  }

  const post = await Post.create({
    author: req.userId!,
    text,
    imageFilename: imageStored,
    visibility,
  });

  await post.populate("author", "firstName lastName email");
  const author = post.author as AuthorShape;

  const postVisibility = post.visibility === "private" ? "private" : "public";
  res.status(201).json({
    post: {
      id: post._id.toString(),
      text: post.text,
      imageUrl: imagePublicUrl(post.imageFilename),
      createdAt: post.createdAt,
      author: serializeAuthor(author),
      visibility: postVisibility,
      isAuthor: true,
      commentCount: 0,
      likeCount: 0,
      likedByMe: false,
      likedByUsers: [],
    },
  });
});

function paramId(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

router.get("/:postId/comments", requireAuth, async (req, res) => {
  const postId = paramId(req.params.postId);
  const userId = req.userId!;
  if (!postId || !mongoose.isValidObjectId(postId)) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }
  const post = await Post.findOne({
    _id: postId,
    ...postVisibilityMatch(userId),
  })
    .select("_id")
    .lean();
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const rows = await Comment.find({ post: postId })
    .sort({ createdAt: 1 })
    .populate("author", "firstName lastName email")
    .lean();

  const flat = rows.map((c) =>
    serializeCommentRow(c as unknown as LeanCommentDoc, userId, postId),
  );
  res.json({ comments: nestCommentTree(flat) });
});

router.post("/:postId/comments", requireAuth, async (req, res) => {
  const postId = paramId(req.params.postId);
  const userId = req.userId!;
  if (!postId || !mongoose.isValidObjectId(postId)) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }

  const raw = req.body?.text;
  const parentRaw = req.body?.parentCommentId;
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) {
    res.status(400).json({ error: "Comment text is required" });
    return;
  }
  if (text.length > 2000) {
    res.status(400).json({ error: "Comment is too long (max 2000 characters)" });
    return;
  }

  let parentComment: string | null = null;
  if (parentRaw != null && parentRaw !== "") {
    if (typeof parentRaw !== "string" || !mongoose.isValidObjectId(parentRaw)) {
      res.status(400).json({ error: "Invalid parent comment" });
      return;
    }
    const parentDoc = await Comment.findById(parentRaw).select("post").lean();
    if (!parentDoc || Array.isArray(parentDoc)) {
      res.status(400).json({ error: "Parent comment does not belong to this post" });
      return;
    }
    if (String((parentDoc as { post?: unknown }).post) !== postId) {
      res.status(400).json({ error: "Parent comment does not belong to this post" });
      return;
    }
    parentComment = parentRaw;
  }

  const post = await Post.findOne({
    _id: postId,
    ...postVisibilityMatch(userId),
  })
    .select("_id")
    .lean();
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const doc = await Comment.create({
    post: postId,
    parentComment,
    author: userId,
    text,
  });
  await doc.populate("author", "firstName lastName email");
  const row = doc.toObject() as unknown as LeanCommentDoc;
  res.status(201).json({
    comment: { ...serializeCommentRow(row, userId, postId), replies: [] },
  });
});

router.post("/:postId/like", requireAuth, async (req, res) => {
  const postId = paramId(req.params.postId);
  const userId = req.userId!;
  if (!postId || !mongoose.isValidObjectId(postId)) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }
  const updated = await Post.findOneAndUpdate(
    { _id: postId, ...postVisibilityMatch(userId) },
    { $addToSet: { likedBy: userId } },
    { new: true },
  )
    .populate("likedBy", "firstName lastName email")
    .lean();
  if (!updated || Array.isArray(updated)) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(likeEngagement(updated.likedBy, userId));
});

router.delete("/:postId/like", requireAuth, async (req, res) => {
  const postId = paramId(req.params.postId);
  const userId = req.userId!;
  if (!postId || !mongoose.isValidObjectId(postId)) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }
  const updated = await Post.findOneAndUpdate(
    { _id: postId, ...postVisibilityMatch(userId) },
    { $pull: { likedBy: userId } },
    { new: true },
  )
    .populate("likedBy", "firstName lastName email")
    .lean();
  if (!updated || Array.isArray(updated)) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(likeEngagement(updated.likedBy, userId));
});

router.delete("/:postId", requireAuth, async (req, res) => {
  const postId = paramId(req.params.postId);
  const userId = req.userId!;
  if (!postId || !mongoose.isValidObjectId(postId)) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }

  const doc = await Post.findOne({
    _id: postId,
    author: userId,
  }).lean();
  if (!doc) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const filename = (doc as { imageFilename?: string | null }).imageFilename;
  if (filename) {
    if (filename.startsWith("https://") || filename.startsWith("http://")) {
      void destroyCloudinaryAssetByUrl(filename);
    } else {
      const fp = path.join(POSTS_UPLOAD_DIR, filename);
      if (fs.existsSync(fp)) {
        try {
          fs.unlinkSync(fp);
        } catch {
          /* ignore */
        }
      }
    }
  }

  await Comment.deleteMany({ post: postId });
  await Post.findByIdAndDelete(postId);
  res.json({ ok: true });
});

export default router;
