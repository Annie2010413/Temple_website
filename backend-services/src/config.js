const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5502),
  corsOrigin: (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  light: {
    appsScriptUrl: requireEnv("LIGHT_APPS_SCRIPT_URL"),
    sharedSecret: requireEnv("LIGHT_SHARED_SECRET")
  },
  signup: {
    appsScriptUrl: requireEnv("SIGNUP_APPS_SCRIPT_URL"),
    sharedSecret: requireEnv("SIGNUP_SHARED_SECRET")
  }
};

module.exports = config;
