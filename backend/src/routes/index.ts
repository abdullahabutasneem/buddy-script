import { Router } from "express";
import authRouter from "./auth.js";
import commentLikesRouter from "./commentLikes.js";
import postsRouter from "./posts.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "buddy-script-api" });
});

router.use("/auth", authRouter);
router.use("/comments", commentLikesRouter);
router.use("/posts", postsRouter);

export default router;
