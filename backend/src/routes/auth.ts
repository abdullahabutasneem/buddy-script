import fs from "node:fs";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { clearAuthCookie, setAuthCookie } from "../utils/cookies.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  optionalAvatarUpload,
  publicAvatarPath,
  removeStoredAvatarIfOwned,
} from "../utils/avatarUpload.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serializePublicUser(u: {
  _id: { toString(): string };
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}) {
  return {
    id: u._id.toString(),
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    avatarUrl: u.avatarUrl ?? null,
  };
}

function validateName(value: unknown, field: string): string | null {
  if (typeof value !== "string") return `${field} is required`;
  const t = value.trim();
  if (t.length < 1) return `${field} is required`;
  if (t.length > 100) return `${field} is too long`;
  return null;
}

router.post("/register", optionalAvatarUpload, async (req, res) => {
  const uploadedPath = req.file?.path;
  const cleanupUpload = () => {
    if (uploadedPath && fs.existsSync(uploadedPath)) {
      try {
        fs.unlinkSync(uploadedPath);
      } catch {
        /* ignore */
      }
    }
  };

  const body = req.body as Record<string, unknown>;
  const { firstName, lastName, email, password, confirmPassword } = body;

  const fnErr = validateName(firstName, "First name");
  if (fnErr) {
    cleanupUpload();
    res.status(400).json({ error: fnErr });
    return;
  }
  const lnErr = validateName(lastName, "Last name");
  if (lnErr) {
    cleanupUpload();
    res.status(400).json({ error: lnErr });
    return;
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    cleanupUpload();
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  const emailNorm = email.trim().toLowerCase();

  if (typeof password !== "string" || password.length < 8) {
    cleanupUpload();
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  if (password.length > 128) {
    cleanupUpload();
    res.status(400).json({ error: "Password is too long" });
    return;
  }
  if (password !== confirmPassword) {
    cleanupUpload();
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  const existing = await User.findOne({ email: emailNorm }).lean();
  if (existing) {
    cleanupUpload();
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const avatarUrl = req.file ? publicAvatarPath(req.file.filename) : null;

  try {
    const user = await User.create({
      email: emailNorm,
      passwordHash,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      ...(avatarUrl ? { avatarUrl } : {}),
    });

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    res.status(201).json({
      user: serializePublicUser(user),
    });
  } catch {
    cleanupUpload();
    res.status(500).json({ error: "Could not create account" });
  }
});

router.patch("/profile", requireAuth, optionalAvatarUpload, async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Choose a profile photo to upload" });
    return;
  }

  const newPath = req.file.path;
  const newUrl = publicAvatarPath(req.file.filename);

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
      res.status(404).json({ error: "User not found" });
      return;
    }

    const previousUrl = user.avatarUrl ?? null;
    user.avatarUrl = newUrl;
    await user.save();
    removeStoredAvatarIfOwned(previousUrl);

    res.json({
      user: serializePublicUser(user),
    });
  } catch {
    if (fs.existsSync(newPath)) {
      try {
        fs.unlinkSync(newPath);
      } catch {
        /* ignore */
      }
    }
    res.status(500).json({ error: "Could not update profile photo" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const emailNorm = email.trim().toLowerCase();
  const user = await User.findOne({ email: emailNorm });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken(user._id.toString());
  setAuthCookie(res, token);

  res.json({
    user: serializePublicUser(user),
  });
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  const u = req.user!;
  res.json({
    user: serializePublicUser(u),
  });
});

export default router;
