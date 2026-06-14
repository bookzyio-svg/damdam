// Remplace les URLs de route /admin -> /360-pilotage, SANS toucher aux imports
// (@/components/admin, @/lib/admin) ni aux API (/api/reviews/admin).
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components", "lib"];
const EXTRA_FILES = ["middleware.ts"];
const SKIP = new Set(["node_modules", ".next", ".git"]);
// /admin en tant que segment complet, NON précédé d'un caractère alphanumérique
const RE = /(?<![A-Za-z0-9])\/admin(?![A-Za-z0-9])/g;

let filesChanged = 0;
let hits = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) processFile(full);
  }
}

function processFile(file) {
  const src = fs.readFileSync(file, "utf8");
  const m = src.match(RE);
  if (!m) return;
  const out = src.replace(RE, "/360-pilotage");
  fs.writeFileSync(file, out);
  filesChanged++;
  hits += m.length;
  console.log(`  ${path.relative(ROOT, file)} (${m.length})`);
}

for (const d of TARGET_DIRS) walk(path.join(ROOT, d));
for (const f of EXTRA_FILES) {
  const full = path.join(ROOT, f);
  if (fs.existsSync(full)) processFile(full);
}
console.log(`\n${hits} remplacements dans ${filesChanged} fichiers.`);
