import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/requireAuth.js";
import { Comment } from "../models/Comment.js";
import { Post } from "../models/Post.js";
import { likeEngagement, type AuthorPublic } from "../utils/likes.js";

const postsDir = path.join(process.cwd(), "uploads", "posts");
fs.mkdirSync(postsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, postsDir);
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

function imagePublicUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  return `/uploads/posts/${filename}`;
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

function serializePost(p: LeanPost, userId: string) {
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
  return {
    id: String(p._id),
    text: p.text,
    imageUrl: imagePublicUrl(p.imageFilename),
    createdAt: p.createdAt,
    author,
    visibility,
    ...likeEngagement(p.likedBy, userId),
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
  const posts = await Post.find(postVisibilityMatch(userId))
    .sort({ createdAt: -1 })
    .populate("author", "firstName lastName email")
    .populate("likedBy", "firstName lastName email")
    .lean();

  res.json({
    posts: posts.map((p) => serializePost(p as unknown as LeanPost, userId)),
  });
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

  const post = await Post.create({
    author: req.userId!,
    text,
    imageFilename: file?.filename ?? null,
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
    .populate("likedBy", "firstName lastName email")
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
  await doc.populate("likedBy", "firstName lastName email");
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

export default router;
