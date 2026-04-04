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
    const user = await User.findById(sub).select("email firstName lastName");
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    req.userId = sub;
    req.user = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    next();
  } catch {
    res.status(401).json({ error: "Not authenticated" });
  }
};
