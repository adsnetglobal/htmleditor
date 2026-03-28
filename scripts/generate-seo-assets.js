#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const siteUrl = String(process.env.SITE_URL || "https://klinik.zhost.digital").replace(/\/+$/, "");

const staticPaths = [
  "/",
  "/services.html",
  "/blog.html",
  "/newsletter-confirm.html"
];

const serviceSlugs = [
  "facial-rejuvenation",
  "laser-brightening",
  "filler-contouring",
  "botox-slimming"
];

const articleSlugs = [
  "panduan-memilih-treatment-kulit-sensitif",
  "laser-vs-facial-mana-yang-cocok",
  "tips-aftercare-setelah-filler"
];

const dynamicPaths = [
  ...serviceSlugs.map((slug) => `/layanan/${slug}`),
  ...articleSlugs.map((slug) => `/blog/${slug}`)
];

const allPaths = [...new Set([...staticPaths, ...dynamicPaths])];

const now = new Date().toISOString();
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allPaths
  .map(
    (route) =>
      `  <url>\n    <loc>${siteUrl}${route}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${route === "/" ? "1.0" : "0.8"}</priority>\n  </url>`
  )
  .join("\n")}\n</urlset>\n`;

const robotsTxt = `User-agent: *\nAllow: /\nDisallow: /admin-area.html\nDisallow: /dashboard.html\nDisallow: /login.html\n\nSitemap: ${siteUrl}/sitemap.xml\n`;

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemapXml, "utf8");
fs.writeFileSync(path.join(ROOT, "robots.txt"), robotsTxt, "utf8");

console.log("Generated robots.txt and sitemap.xml for", siteUrl);
