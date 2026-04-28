const express = require("express");
const cors = require("cors");
const config = require("./config");
const { connectDb } = require("./db");
const authRoutes = require("./routes/auth");
const progressRoutes = require("./routes/progress");
const challengeRoutes = require("./routes/challenge");

async function bootstrap() {
  await connectDb();

  const app = express();
  app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, env: config.nodeEnv });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/progress", progressRoutes);
  app.use("/api/challenge", challengeRoutes);

  app.listen(config.port, () => {
    console.log(`Backend running on http://localhost:${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
