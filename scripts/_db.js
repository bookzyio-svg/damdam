const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

function loadEnv() {
  const p = path.join(process.cwd(), ".env.local");
  const env = {};
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) { let v = m[2].trim(); if ((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1); env[m[1]]=v; }
    }
  }
  return env;
}

async function connect() {
  const env = loadEnv();
  const uri = env.MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI introuvable dans .env.local");
  await mongoose.connect(uri);
  return mongoose;
}

module.exports = { connect, loadEnv };
