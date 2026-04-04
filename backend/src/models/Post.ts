import mongoose, { Schema, type Types } from "mongoose";

export type PostVisibility = "public" | "private";

export interface IPost {
  author: Types.ObjectId;
  text: string;
  imageFilename: string | null;
  likedBy: Types.ObjectId[];
  visibility: PostVisibility;
}

const postSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, default: "", trim: true, maxlength: 5000 },
    imageFilename: { type: String, default: null },
    likedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ visibility: 1, author: 1 });

export const Post = mongoose.models.Post ?? mongoose.model<IPost>("Post", postSchema);
