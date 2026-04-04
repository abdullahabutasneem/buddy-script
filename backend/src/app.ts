import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import routes from "./routes/index.js";

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

const uploadsRoot = path.join(process.cwd(), "uploads");

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: frontendOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use("/uploads", express.static(uploadsRoot));

  app.use("/api", routes);

  return app;
}
