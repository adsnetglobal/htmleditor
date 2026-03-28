const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const TARGET_PAGES = [
  "index.html",
  "services.html",
  "service-detail.html",
  "blog.html",
  "article.html",
  "newsletter-confirm.html"
];

function readFileSafe(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseTags(html, tagName) {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  const tags = [];
  let match = pattern.exec(html);
  while (match) {
    const attrs = {};
    const source = match[1] || "";
    source.replace(/([^\s=]+)\s*=\s*(['"])(.*?)\2/g, (_, key, __, value) => {
      attrs[String(key || "").toLowerCase()] = value;
      return "";
    });
    tags.push(attrs);
    match = pattern.exec(html);
  }
  return tags;
}

function findMeta(metaTags, attrName, attrValue) {
  return metaTags.find((tag) => tag[attrName] === attrValue) || null;
}

function findLink(linkTags, relValue) {
  return linkTags.find((tag) => String(tag.rel || "").toLowerCase() === relValue) || null;
}

function getTitleText(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? String(match[1]).trim() : "";
}

function countHeading(html, level) {
  const match = html.match(new RegExp(`<h${level}\\b`, "gi"));
  return match ? match.length : 0;
}

function resolveLocalAsset(assetUrl) {
  if (!assetUrl) return null;
  if (/^https?:\/\//i.test(assetUrl)) return null;
  const cleanUrl = assetUrl.split("#")[0].split("?")[0].replace(/^\.?\//, "");
  return path.join(ROOT, cleanUrl);
}

function readPngDimensions(buffer) {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    return null;
  }
  if (buffer.subarray(12, 16).toString("ascii") !== "IHDR") {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function pushResult(collection, passed, label, detail) {
  collection.push({ passed, label, detail });
}

function validatePage(pageName) {
  const filePath = path.join(ROOT, pageName);
  const results = [];
  if (!fs.existsSync(filePath)) {
    pushResult(results, false, `[${pageName}] File ditemukan`, filePath);
    return results;
  }

  const html = readFileSafe(filePath);
  const metaTags = parseTags(html, "meta");
  const linkTags = parseTags(html, "link");
  const titleText = getTitleText(html);
  const description = findMeta(metaTags, "name", "description");
  const canonical = findLink(linkTags, "canonical");

  pushResult(results, !!titleText, `[${pageName}] Title tersedia`, titleText);
  pushResult(results, titleText.length <= 60, `[${pageName}] Title <= 60 karakter`, `${titleText.length} karakter`);
  pushResult(results, !!description && !!description.content, `[${pageName}] Meta description tersedia`, description ? description.content : "");
  pushResult(
    results,
    !!description && String(description.content || "").length <= 160,
    `[${pageName}] Meta description <= 160 karakter`,
    description ? `${String(description.content || "").length} karakter` : "Tidak ditemukan"
  );
  pushResult(results, !!canonical && !!canonical.href, `[${pageName}] Canonical tersedia`, canonical ? canonical.href : "");

  const h1Count = countHeading(html, 1);
  const h2Count = countHeading(html, 2);
  const h3Count = countHeading(html, 3);
  pushResult(results, h1Count >= 1, `[${pageName}] Minimal 1x H1`, `H1=${h1Count}`);
  pushResult(results, h2Count >= 1, `[${pageName}] Minimal 1x H2`, `H2=${h2Count}`);
  pushResult(results, h3Count >= 1, `[${pageName}] Minimal 1x H3`, `H3=${h3Count}`);

  if (pageName === "index.html" || pageName === "article.html") {
    const ogTitle = findMeta(metaTags, "property", "og:title");
    const ogDescription = findMeta(metaTags, "property", "og:description");
    const ogImage = findMeta(metaTags, "property", "og:image");
    const twitterCard = findMeta(metaTags, "name", "twitter:card");
    const twitterImage = findMeta(metaTags, "name", "twitter:image");

    pushResult(results, !!ogTitle && !!ogTitle.content, `[${pageName}] og:title tersedia`, ogTitle ? ogTitle.content : "");
    pushResult(results, !!ogDescription && !!ogDescription.content, `[${pageName}] og:description tersedia`, ogDescription ? ogDescription.content : "");
    pushResult(results, !!ogImage && !!ogImage.content, `[${pageName}] og:image tersedia`, ogImage ? ogImage.content : "");
    pushResult(results, !!twitterCard && !!twitterCard.content, `[${pageName}] twitter:card tersedia`, twitterCard ? twitterCard.content : "");
    pushResult(results, !!twitterImage && !!twitterImage.content, `[${pageName}] twitter:image tersedia`, twitterImage ? twitterImage.content : "");

    if (ogImage && ogImage.content) {
      const localAssetPath = resolveLocalAsset(ogImage.content);
      if (localAssetPath && fs.existsSync(localAssetPath)) {
        const stats = fs.statSync(localAssetPath);
        const ext = path.extname(localAssetPath).toLowerCase();
        pushResult(results, stats.size <= 1048576, `[${pageName}] OG image <= 1MB`, `${stats.size} bytes`);

        if (ext === ".png") {
          const dimensions = readPngDimensions(fs.readFileSync(localAssetPath));
          pushResult(results, !!dimensions, `[${pageName}] PNG valid`, localAssetPath);
          if (dimensions) {
            pushResult(results, dimensions.width === 1200 && dimensions.height === 630, `[${pageName}] PNG 1200x630`, `${dimensions.width}x${dimensions.height}`);
          }
        } else if (ext === ".svg") {
          pushResult(results, true, `[${pageName}] SVG OG image terdeteksi`, localAssetPath);
        }
      }
    }
  }

  return results;
}

function main() {
  const results = TARGET_PAGES.flatMap(validatePage);
  const failed = results.filter((item) => !item.passed);

  console.log("SEO validation results:");
  results.forEach((item) => {
    const prefix = item.passed ? "PASS" : "FAIL";
    console.log(`[${prefix}] ${item.label}${item.detail ? ` -> ${item.detail}` : ""}`);
  });

  if (failed.length) {
    console.error(`SEO validation failed with ${failed.length} issue(s).`);
    process.exit(1);
  }

  console.log("SEO validation passed.");
}

main();
