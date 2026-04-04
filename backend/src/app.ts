import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import routes from "./routes/index.js";

function parseCorsOrigins(): string | string[] {
  const raw = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return "http://localhost:3000";
  if (list.length === 1) return list[0]!;
  return list;
}

const uploadsRoot = path.join(process.cwd(), "uploads");

export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  if (process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: parseCorsOrigins(),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use("/uploads", express.static(uploadsRoot));

  app.use("/api", routes);

  return app;
}
