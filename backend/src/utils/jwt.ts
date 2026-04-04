import jwt, { type SignOptions } from "jsonwebtoken";

/** Default session length: 7 days (seconds). Override with JWT_EXPIRES_SEC (integer). */
const DEFAULT_EXPIRES_SEC = 7 * 24 * 60 * 60;

function expiresInSeconds(): number {
  const raw = process.env.JWT_EXPIRES_SEC;
  if (raw && /^\d+$/.test(raw)) {
    return parseInt(raw, 10);
  }
  return DEFAULT_EXPIRES_SEC;
}

export function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  const options: SignOptions = { expiresIn: expiresInSeconds() };
  return jwt.sign({ sub: userId }, secret, options);
}

export function verifyToken(token: string): { sub: string } {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  const decoded = jwt.verify(token, secret) as { sub: string };
  return decoded;
}
