import type { RequestHandler } from "express";
import { User } from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";
import { AUTH_COOKIE_NAME } from "../utils/cookies.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = req.cookies[AUTH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { sub } = verifyToken(token);
    const user = await User.findById(sub).select("email firstName lastName avatarUrl");
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    /** Canonical hex id so like/author checks match Mongo `ObjectId` string forms. */
    req.userId = user._id.toString();
    req.user = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl ?? null,
    };
    next();
  } catch {
    res.status(401).json({ error: "Not authenticated" });
  }
};
