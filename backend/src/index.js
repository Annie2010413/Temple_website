const express = require("express");
const cors = require("cors");
const config = require("./config");
const { connectDb } = require("./db");
const { generalLimiter } = require("./middleware/limiters");
const authRoutes = require("./routes/auth");
const progressRoutes = require("./routes/progress");
const challengeRoutes = require("./routes/challenge");

async function bootstrap() {
  await connectDb();

  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin }));
  app.use(express.json({ limit: "32kb" }));
  app.use("/api/", generalLimiter);

  app.get("/api/health", (_req, res) => {
    res.set("Cache-Control", "public, max-age=10");
    const payload = { ok: true };
    if (config.nodeEnv !== "production") {
      payload.env = config.nodeEnv;
    }
    res.json(payload);
  });

  app.get("/", (_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/progress", progressRoutes);
  app.use("/api/challenge", challengeRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  app.listen(config.port, () => {
    console.log(`Backend running on http://localhost:${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
