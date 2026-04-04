import mongoose, { Schema } from "mongoose";

export interface IUser {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  /** Public URL path (e.g. `/uploads/...`) or absolute URL; optional profile photo */
  avatarUrl?: string | null;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    avatarUrl: { type: String, trim: true, maxlength: 2048, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
