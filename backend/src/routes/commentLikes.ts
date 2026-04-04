import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/requireAuth.js";
import { Comment } from "../models/Comment.js";

const router = Router();

function likeFieldsForUser(doc: { likedBy?: unknown[] }, userId: string) {
  const ids = (doc.likedBy ?? []) as mongoose.Types.ObjectId[];
  return {
    likeCount: ids.length,
    likedByMe: ids.some((id) => String(id) === userId),
  };
}

router.post("/:commentId/like", requireAuth, async (req, res) => {
  const { commentId } = req.params;
  const userId = req.userId!;
  if (!mongoose.isValidObjectId(commentId)) {
    res.status(400).json({ error: "Invalid comment id" });
    return;
  }
  const updated = await Comment.findByIdAndUpdate(
    commentId,
    { $addToSet: { likedBy: userId } },
    { new: true },
  ).lean();
  if (!updated || Array.isArray(updated)) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  res.json(likeFieldsForUser(updated as { likedBy?: unknown[] }, userId));
});

router.delete("/:commentId/like", requireAuth, async (req, res) => {
  const { commentId } = req.params;
  const userId = req.userId!;
  if (!mongoose.isValidObjectId(commentId)) {
    res.status(400).json({ error: "Invalid comment id" });
    return;
  }
  const updated = await Comment.findByIdAndUpdate(
    commentId,
    { $pull: { likedBy: userId } },
    { new: true },
  ).lean();
  if (!updated || Array.isArray(updated)) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  res.json(likeFieldsForUser(updated as { likedBy?: unknown[] }, userId));
});

export default router;
