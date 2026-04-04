import { jwtVerify, type JWTPayload } from "jose";

/** Backend uses `jsonwebtoken` default: HS256 + `sub` claim. */
const ALGS: ("HS256")[] = ["HS256"];

export async function verifyBuddyJwt(
  token: string,
  secret: string,
): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
    algorithms: ALGS,
  });
  const sub = payload.sub;
  if (sub == null || sub === "") {
    throw new Error("Missing token subject");
  }
  return payload;
}
