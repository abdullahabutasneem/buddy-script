import mongoose, { Schema, type Types } from "mongoose";

export type PostVisibility = "public" | "private";

/** Stored upload basename only (no path segments); matches multer-generated names. */
const SAFE_FILENAME_RE = /^[a-zA-Z0-9._-]+$/;

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
      maxlength: 255,
      validate: {
        validator(value: string | null) {
          if (value == null || value === "") return true;
          return SAFE_FILENAME_RE.test(value) && !value.includes("..");
        },
        message: "Invalid stored image filename",
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
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });

export const Post = mongoose.models.Post ?? mongoose.model<IPost>("Post", postSchema);
