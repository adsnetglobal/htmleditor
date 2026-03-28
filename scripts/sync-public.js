#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(src, dst) {
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
}

function copyDir(srcDir, dstDir) {
  ensureDir(dstDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(srcDir, entry.name);
    const dst = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dst);
    } else {
      copyFile(src, dst);
    }
  }
}

function main() {
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  ensureDir(outDir);

  const rootEntries = fs.readdirSync(root, { withFileTypes: true });
  const htmlFiles = rootEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".html"))
    .map((entry) => entry.name);

  const includeFiles = [
    ...htmlFiles,
    "config.js",
    "site.config.js",
    "manifest.json",
    "robots.txt",
    "sitemap.xml",
    "_headers",
    "_redirects"
  ];

  for (const fileName of includeFiles) {
    const src = path.join(root, fileName);
    if (fs.existsSync(src)) {
      copyFile(src, path.join(outDir, fileName));
    }
  }

  const assetsSrc = path.join(root, "assets");
  if (fs.existsSync(assetsSrc)) {
    copyDir(assetsSrc, path.join(outDir, "assets"));
  }

  console.log(`Public directory generated at: ${outDir}`);
}

main();
