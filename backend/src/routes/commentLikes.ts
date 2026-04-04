import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/requireAuth.js";
import { Comment } from "../models/Comment.js";
import { likeEngagement } from "../utils/likes.js";

const router = Router();

function paramId(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

router.post("/:commentId/like", requireAuth, async (req, res) => {
  const commentId = paramId(req.params.commentId);
  const userId = req.userId!;
  if (!commentId || !mongoose.isValidObjectId(commentId)) {
    res.status(400).json({ error: "Invalid comment id" });
    return;
  }
  const updated = await Comment.findByIdAndUpdate(
    commentId,
    { $addToSet: { likedBy: userId } },
    { new: true },
  )
    .populate("likedBy", "firstName lastName email")
    .lean();
  if (!updated || Array.isArray(updated)) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  res.json(likeEngagement(updated.likedBy, userId));
});

router.delete("/:commentId/like", requireAuth, async (req, res) => {
  const commentId = paramId(req.params.commentId);
  const userId = req.userId!;
  if (!commentId || !mongoose.isValidObjectId(commentId)) {
    res.status(400).json({ error: "Invalid comment id" });
    return;
  }
  const updated = await Comment.findByIdAndUpdate(
    commentId,
    { $pull: { likedBy: userId } },
    { new: true },
  )
    .populate("likedBy", "firstName lastName email")
    .lean();
  if (!updated || Array.isArray(updated)) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  res.json(likeEngagement(updated.likedBy, userId));
});

export default router;
