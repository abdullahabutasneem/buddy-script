import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        _id: Types.ObjectId;
        email: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export {};
