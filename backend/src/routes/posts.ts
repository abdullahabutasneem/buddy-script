import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth.js";
import { Post } from "../models/Post.js";

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

router.get("/", requireAuth, async (_req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate("author", "firstName lastName email")
    .lean();

  res.json({
    posts: posts.map((p) => {
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
      return {
        id: String(p._id),
        text: p.text,
        imageUrl: imagePublicUrl(p.imageFilename),
        createdAt: p.createdAt,
        author,
      };
    }),
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

  const post = await Post.create({
    author: req.userId!,
    text,
    imageFilename: file?.filename ?? null,
  });

  await post.populate("author", "firstName lastName email");
  const author = post.author as AuthorShape;

  res.status(201).json({
    post: {
      id: post._id.toString(),
      text: post.text,
      imageUrl: imagePublicUrl(post.imageFilename),
      createdAt: post.createdAt,
      author: serializeAuthor(author),
    },
  });
});

export default router;
