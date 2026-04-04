import mongoose, { Schema } from "mongoose";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      match: [EMAIL_RE, "Invalid email format"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
      minlength: 10,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    avatarUrl: { type: String, trim: true, maxlength: 2048, default: null },
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    const o = ret as unknown as Record<string, unknown>;
    delete o.passwordHash;
    return ret;
  },
});

export const User = mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
