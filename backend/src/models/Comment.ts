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
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    likedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
  },
  { timestamps: true },
);

commentSchema.index({ post: 1, createdAt: 1 });

export const Comment =
  mongoose.models.Comment ?? mongoose.model<IComment>("Comment", commentSchema);
