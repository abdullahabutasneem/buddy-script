import mongoose, { Schema, type Types } from "mongoose";

export type PostVisibility = "public" | "private";

/** Local disk: basename only. Cloud: full `https://` URL (e.g. Cloudinary). */
const SAFE_FILENAME_RE = /^[a-zA-Z0-9._-]+$/;

function isValidStoredPostImage(value: string | null): boolean {
  if (value == null || value === "") return true;
  if (value.startsWith("https://")) {
    try {
      const u = new URL(value);
      return u.protocol === "https:" && value.length <= 2048;
    } catch {
      return false;
    }
  }
  return SAFE_FILENAME_RE.test(value) && !value.includes("..");
}

export interface IPost {
  author: Types.ObjectId;
  text: string;
  imageFilename: string | null;
  likedBy: Types.ObjectId[];
  visibility: PostVisibility;
}

const postSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "", trim: true, maxlength: 5000 },
    imageFilename: {
      type: String,
      default: null,
      maxlength: 2048,
      validate: {
        validator(value: string | null) {
          return isValidStoredPostImage(value);
        },
        message: "Invalid stored post image",
      },
    },
    likedBy: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    visibility: {
      type: String,
      enum: {
        values: ["public", "private"],
        message: "{VALUE} is not a valid visibility",
      },
      default: "public",
    },
  },
  { timestamps: true },
);

postSchema.index({ createdAt: -1 });
postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1, _id: -1 });

export const Post = mongoose.models.Post ?? mongoose.model<IPost>("Post", postSchema);
