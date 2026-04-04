import mongoose, { Schema } from "mongoose";

export interface IUser {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
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
  },
  { timestamps: true }
);

export const User = mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
