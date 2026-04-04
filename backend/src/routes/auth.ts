import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { clearAuthCookie, setAuthCookie } from "../utils/cookies.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateName(value: unknown, field: string): string | null {
  if (typeof value !== "string") return `${field} is required`;
  const t = value.trim();
  if (t.length < 1) return `${field} is required`;
  if (t.length > 100) return `${field} is too long`;
  return null;
}

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body ?? {};

  const fnErr = validateName(firstName, "First name");
  if (fnErr) {
    res.status(400).json({ error: fnErr });
    return;
  }
  const lnErr = validateName(lastName, "Last name");
  if (lnErr) {
    res.status(400).json({ error: lnErr });
    return;
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  const emailNorm = email.trim().toLowerCase();

  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  if (password.length > 128) {
    res.status(400).json({ error: "Password is too long" });
    return;
  }
  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  const existing = await User.findOne({ email: emailNorm }).lean();
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    email: emailNorm,
    passwordHash,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
  });

  const token = signToken(user._id.toString());
  setAuthCookie(res, token);

  res.status(201).json({
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
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
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  const u = req.user!;
  res.json({
    user: {
      id: u._id.toString(),
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
    },
  });
});

export default router;
