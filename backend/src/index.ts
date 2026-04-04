import "dotenv/config";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";

const PORT = Number(process.env.PORT) || 4000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("Missing MONGODB_URI. Copy backend/.env.example to backend/.env and set your connection string.");
  process.exit(1);
}

async function main(uri: string) {
  await connectDb(uri);
  console.log("MongoDB connected");

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main(mongoUri).catch((err) => {
  console.error(err);
  process.exit(1);
});
