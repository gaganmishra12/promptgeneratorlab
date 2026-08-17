// build.js
// Generates the 4 model landing pages (chatgpt / claude / gemini / ai-image
// prompt generators) as plain static HTML files, and appends their URLs to
// sitemap.xml at the site root. Mirrors tools/frameworks/build.js exactly —
// same nav/footer/head markup and CSS classes — so these pages match the
// rest of the site.
//
// Usage: cd tools/models && node build.js
// This file lives at /tools/models/build.js — two levels up is the site root.
// It only ever deletes ITS OWN output folders (one per model slug),
// never prompt-frameworks/, never the site root itself.
//
// Sitemap handling: this script does NOT regenerate sitemap.xml from
// scratch (that's tools/frameworks/build.js's job for the core + framework
// URLs). It only reads the existing sitemap.xml and appends the 4 model
// URLs if they aren't already there. Safe to run in any order relative to
// the frameworks build script, and safe to re-run — it never duplicates
// entries.

const fs = require("fs");
const path = require("path");

const SITE_URL = "https://promptgeneratorlab.com";
const SITE_ROOT = path.join(__dirname, "..", "..");
const OUT_DIR = SITE_ROOT; // pages are written at SITE_ROOT/<slug>/...
const SITEMAP_PATH = path.join(SITE_ROOT, "sitemap.xml");

const models = JSON.parse(fs.readFileSync(path.join(__dirname, "data/models.json"), "utf8"));
const byModelSlug = Object.fromEntries(models.map(m => [m.slug, m]));

// Framework data is used to render "Recommended frameworks" cross-links.
const frameworksPath = path.join(__dirname, "..", "frameworks", "data", "frameworks.json");
const frameworks = fs.existsSync(frameworksPath)
  ? JSON.parse(fs.readFileSync(frameworksPath, "utf8"))
  : [];
const byFrameworkSlug = Object.fromEntries(frameworks.map(f => [f.slug, f]));

// ---------- Shared markup (copied verbatim from tools/frameworks/build.js) ----------

function nav() {
  return `<nav class="site-nav">
  <div class="wrap">
    <a href="/" class="logo">promptgeneratorlab<span class="dot">.</span></a>
    <div class="nav-links">
      <a href="/#how">How to Use</a>
      <a href="/#why">Why Use It</a>
      <a href="/prompt-frameworks/">Frameworks</a>
      <a href="/faq.html">FAQ</a>
      <a href="/examples.html">Examples</a>
      <a href="/about.html">About</a>
      <a href="/#generator" class="cta">Try It Free</a>
    </div>
  </div>
</nav>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="col">
        <h4>promptgeneratorlab</h4>
        <a href="/">Free AI Prompt Generator</a>
      </div>
      <div class="col">
        <h4>Site</h4>
        <a href="/#how">How to Use</a>
        <a href="/#why">Why Use It</a>
        <a href="/prompt-frameworks/">Prompt Frameworks</a>
        <a href="/faq.html">FAQ</a>
        <a href="/examples.html">Example Prompts</a>
        <a href="/about.html">About Us</a>
        <a href="/contact.html">Contact Us</a>
      </div>
      <div class="col">
        <h4>Legal</h4>
        <a href="/privacy.html">Privacy Policy</a>
        <a href="/terms.html">Terms &amp; Conditions</a>
        <a href="/cookie-policy.html">Cookie Policy</a>
        <a href="/disclaimer.html">Disclaimer</a>
      </div>
    </div>
    <div class="footer-bottom">© <span id="year"></span> promptgeneratorlab.com — Free AI Prompt Generator.</div>
  </div>
</footer>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
<script src="/js/cookie-consent.js"></script>`;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function head({ title, description, canonical, breadcrumbLd, extraLd }) {
  return `<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="stylesheet" href="/css/style.css">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE_URL}/og-image.png">
<meta property="og:site_name" content="PromptGeneratorLab">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE_URL}/og-image.png">
<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
${extraLd ? `<script type="application/ld+json">${JSON.stringify(extraLd)}</script>` : ""}
</head>`;
}

function breadcrumbNav(items) {
  const links = items.map((it, i) =>
    i === items.length - 1
      ? `<span aria-current="page">${esc(it.name)}</span>`
      : `<a href="${it.url}">${esc(it.name)}</a>`
  ).join(' <span class="crumb-sep">/</span> ');
  return `<nav class="breadcrumbs wrap" aria-label="Breadcrumb">${links}</nav>`;
}

function breadcrumbLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((it, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": it.name,
      "item": it.url.startsWith("http") ? it.url : SITE_URL + it.url
    }))
  };
}

// ---------- Model detail pages ----------

function buildDetail(m) {
  const crumbs = [
    { name: "Home", url: "/" },
    { name: `${m.modelName} Prompt Generator`, url: `/${m.slug}/` }
  ];
  const title = `${m.modelName} Prompt Generator — Structured Prompts for ${m.modelName} | PromptGeneratorLab`;
  const description = `${m.tagline} Free tool, no signup — describe your idea and get a structured ${m.modelName} prompt in seconds.`;
  const canonical = `${SITE_URL}/${m.slug}/`;

  const softwareAppLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": `${m.modelName} Prompt Generator`,
    "applicationCategory": "UtilitiesApplication",
    "description": description,
    "url": canonical,
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };

  const strengthRows = m.strengths.map(s => `
      <div class="faq-item">
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.description)}</p>
      </div>`).join("");

  const recommendedFrameworks = (m.recommendedFrameworks || [])
    .map(slug => byFrameworkSlug[slug])
    .filter(Boolean)
    .map(f => `
        <div class="card">
          <div class="num">${esc(f.acronym)}</div>
          <h3><a href="/prompt-frameworks/${f.slug}/">${esc(f.acronym)}</a></h3>
          <p>${esc(f.tagline)}</p>
        </div>`).join("");

  const relatedModels = (m.related || [])
    .map(slug => byModelSlug[slug])
    .filter(Boolean)
    .map(r => `
        <div class="card">
          <div class="num">${esc(r.modelName)}</div>
          <h3><a href="/${r.slug}/">${esc(r.modelName)} Prompt Generator</a></h3>
          <p>${esc(r.tagline)}</p>
        </div>`).join("");

  const ctaHref = m.generatorValue
    ? `/?model=${encodeURIComponent(m.generatorValue)}#generator`
    : `/#generator`;
  const ctaNote = m.generatorValue
    ? ""
    : `<p class="note" style="font-size:13px;color:var(--text-soft);">The generator doesn't have a dedicated ${esc(m.modelName)} mode yet — use Universal, which works well as a starting point.</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
${head({ title, description, canonical, breadcrumbLd: breadcrumbLd(crumbs), extraLd: softwareAppLd })}
<body>
${nav()}
${breadcrumbNav(crumbs)}
<header class="page-head">
  <div class="wrap">
    <div class="eyebrow">AI Model</div>
    <h1>${esc(m.modelName)} <span class="accent">prompt generator</span></h1>
    <p class="sub"><strong>${esc(m.vendor)}</strong> — ${esc(m.tagline)}</p>
  </div>
</header>

<section class="info">
  <div class="wrap legal">
    <h2>When to use ${esc(m.modelName)}-optimized prompts</h2>
    <p>${esc(m.whenToUse)}</p>

    <h2>${esc(m.modelName)} strengths to prompt around</h2>
  </div>
  <div class="wrap">
    <div class="tool-section" style="padding-top:0;">
      ${strengthRows}
    </div>
  </div>

  <div class="wrap legal">
    <h2>Bad prompt vs. structured prompt</h2>
    <p><strong>Bad prompt:</strong></p>
    <p style="font-style:italic;">“${esc(m.badPrompt)}”</p>
    <p><strong>Structured:</strong></p>
    <pre style="white-space:pre-wrap; background:var(--card); padding:16px; border-radius:10px; border:1px solid var(--border); font-family:'IBM Plex Mono',monospace; font-size:13.5px; line-height:1.7;">${esc(m.goodPrompt)}</pre>

    <h2>What you get back</h2>
    <p>${esc(m.exampleOutput)}</p>

    <p><a href="${ctaHref}" class="cta">Generate a ${esc(m.modelName)} prompt →</a></p>
    ${ctaNote}
  </div>
</section>

<section class="tool-section">
  <div class="wrap">
    <h2>Recommended frameworks for ${esc(m.modelName)}</h2>
    <div class="grid3">${recommendedFrameworks}
    </div>
  </div>
</section>

<section class="tool-section">
  <div class="wrap">
    <h2>Other model pages</h2>
    <div class="grid3">${relatedModels}
    </div>
  </div>
</section>

${footer()}
</body>
</html>`;

  const dir = path.join(OUT_DIR, m.slug);
  fs.rmSync(dir, { recursive: true, force: true }); // only this model's own folder
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

// ---------- Sitemap (additive — does not touch existing entries) ----------

function updateSitemap() {
  let xml;
  try {
    xml = fs.readFileSync(SITEMAP_PATH, "utf8");
  } catch (e) {
    xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`;
  }

  const newEntries = models
    .map(m => {
      const loc = `${SITE_URL}/${m.slug}/`;
      if (xml.includes(`<loc>${loc}</loc>`)) return ""; // already present, skip
      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    })
    .filter(Boolean)
    .join("");

  if (!newEntries) {
    console.log("sitemap.xml already contains all model URLs — nothing to add.");
    return;
  }

  const updated = xml.replace("</urlset>", `${newEntries}</urlset>`);
  fs.writeFileSync(SITEMAP_PATH, updated);
  console.log(`Appended ${newEntries.split("<url>").length - 1} model URL(s) to sitemap.xml`);
}

// ---------- Run ----------
models.forEach(buildDetail);
updateSitemap();
console.log(`Built ${models.length} model pages into ${SITE_ROOT}`);
