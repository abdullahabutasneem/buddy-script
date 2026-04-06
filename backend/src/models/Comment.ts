import mongoose, { Schema, type Types } from "mongoose";

export interface IComment {
  post: Types.ObjectId;
  parentComment: Types.ObjectId | null;
  author: Types.ObjectId;
  text: string;
  likedBy: Types.ObjectId[];
}

const commentSchema = new Schema<IComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    likedBy: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  { timestamps: true },
);

commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ post: 1, parentComment: 1, createdAt: 1 });
commentSchema.index({ author: 1, createdAt: -1 });

export const Comment =
  mongoose.models.Comment ?? mongoose.model<IComment>("Comment", commentSchema);
