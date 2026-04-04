import { Router } from "express";
import authRouter from "./auth.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "buddy-script-api" });
});

router.use("/auth", authRouter);

export default router;
