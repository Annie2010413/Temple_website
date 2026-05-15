const express = require("express");
const cors = require("cors");
const config = require("./config");
const { generalLimiter } = require("./middleware/limiters");
const lightRoutes = require("./routes/light");
const signupRoutes = require("./routes/signup");

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  cors({
    origin: (origin, cb) => {
      // 允許無 origin（伺服器對伺服器、curl）與白名單內的
      if (!origin) return cb(null, true);
      if (config.corsOrigin.includes("*") || config.corsOrigin.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS: " + origin));
    }
  })
);

app.use(express.json({ limit: "16kb" }));
app.use("/api/", generalLimiter);

app.get("/api/health", (_req, res) => {
  res.set("Cache-Control", "public, max-age=10");
  const payload = { ok: true };
  if (config.nodeEnv !== "production") {
    payload.env = config.nodeEnv;
  }
  res.json(payload);
});

app.use("/api/light", lightRoutes);
app.use("/api/signup", signupRoutes);

app.get("/", (_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(config.port, () => {
  console.log(`Services backend running on http://localhost:${config.port}`);
});
