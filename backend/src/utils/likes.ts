import mongoose from "mongoose";

export type AuthorPublic = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type AuthorShape = {
  _id: unknown;
  firstName: string;
  lastName: string;
  email: string;
};

function authorFromLean(a: AuthorShape | null | undefined): AuthorPublic {
  if (!a || a._id == null) {
    return { id: "", firstName: "Unknown", lastName: "user", email: "" };
  }
  return {
    id: String(a._id),
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email,
  };
}

export function serializeLikedByUsers(likedBy: unknown[] | undefined): AuthorPublic[] {
  const list = likedBy ?? [];
  return list.map((entry) => {
    if (entry && typeof entry === "object" && "_id" in entry) {
      return authorFromLean(entry as AuthorShape);
    }
    return { id: String(entry), firstName: "Unknown", lastName: "", email: "" };
  });
}

function normalizeLikerIds(likedBy: unknown[] | undefined): string[] {
  return (likedBy ?? []).map((x) =>
    x && typeof x === "object" && x !== null && "_id" in x
      ? String((x as { _id: unknown })._id)
      : String(x),
  );
}

/** True if two ids refer to the same user (handles ObjectId vs string quirks). */
export function userIdsEqual(a: string, b: string): boolean {
  const sa = String(a).trim();
  const sb = String(b).trim();
  if (sa === sb) return true;
  if (mongoose.isValidObjectId(sa) && mongoose.isValidObjectId(sb)) {
    try {
      return new mongoose.Types.ObjectId(sa).equals(new mongoose.Types.ObjectId(sb));
    } catch {
      return false;
    }
  }
  return false;
}

/** Count, current user flag, and populated liker profiles (populate likedBy for names). */
export function likeEngagement(likedBy: unknown[] | undefined, userId: string) {
  const ids = normalizeLikerIds(likedBy);
  return {
    likeCount: ids.length,
    likedByMe: ids.some((id) => userIdsEqual(id, userId)),
    likedByUsers: serializeLikedByUsers(likedBy),
  };
}

/**
 * Feed list: accurate counts from full `likedBy` id list, but only a small preview
 * of user profiles (resolved separately) to avoid loading millions of liker docs.
 */
export function likeEngagementForFeed(
  likedByRaw: unknown[] | undefined,
  userId: string,
  previewAuthors: AuthorPublic[],
) {
  const ids = normalizeLikerIds(likedByRaw);
  return {
    likeCount: ids.length,
    likedByMe: ids.some((id) => userIdsEqual(id, userId)),
    likedByUsers: previewAuthors,
  };
}
