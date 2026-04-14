/**
 * PM2: lavinia kökünden `pm2 start ecosystem.lavinia.cjs`
 * .env.production içindeki anahtarlar çocuk sürece aktarılır (CRLF/BOM temizlenir).
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function sanitizeValue(v) {
  if (typeof v !== "string") return v;
  return v
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .trim();
}

function mergeFile(map, filePath) {
  if (!fs.existsSync(filePath)) return map;
  const parsed = dotenv.parse(fs.readFileSync(filePath, "utf8"));
  const next = { ...map };
  for (const [k, v] of Object.entries(parsed)) {
    next[k] = sanitizeValue(v);
  }
  return next;
}

let merged = {};
merged = mergeFile(merged, path.join(__dirname, ".env.production"));
merged = mergeFile(merged, path.join(__dirname, ".env.local"));

const env = {
  NODE_ENV: "production",
  ...merged,
};

if (!env.API_INTERNAL_URL) {
  env.API_INTERNAL_URL = "http://127.0.0.1:5000";
}
if (!env.SIMPLCOMMERCE_API_URL) {
  env.SIMPLCOMMERCE_API_URL = env.API_INTERNAL_URL;
}

module.exports = {
  apps: [
    {
      name: "lavinia",
      cwd: path.join(__dirname, ".next", "standalone"),
      script: "server.js",
      env,
    },
  ],
};
