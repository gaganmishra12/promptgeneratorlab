// build.js
// Generates /prompt-frameworks/ (hub + one page per framework) as plain
// static HTML files, and rewrites sitemap.xml at the site root to include
// them. No server-side rendering needed — just re-run this after editing
// data/frameworks.json and re-upload the site root to Hostinger.
//
// Usage: cd tools/frameworks && node build.js
// This file lives at /tools/frameworks/build.js — two levels up is the site root.
// It only ever deletes its OWN output folder (SITE_ROOT/prompt-frameworks/),
// never the site root itself.

const fs = require("fs");
const path = require("path");

const SITE_URL = "https://promptgeneratorlab.com";
const SITE_ROOT = path.join(__dirname, "..", "..");
const OUT_DIR = SITE_ROOT; // pages are written at SITE_ROOT/prompt-frameworks/...
const frameworks = JSON.parse(fs.readFileSync(path.join(__dirname, "data/frameworks.json"), "utf8"));

const byslug = Object.fromEntries(frameworks.map(f => [f.slug, f]));

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
  // items: [{name, url}]
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

// ---------- Hub page ----------
function buildHub() {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Prompt Frameworks", url: "/prompt-frameworks/" }];
  const title = "12 AI Prompt Frameworks — ORACLE, RACE, CARE, APE & More | PromptGeneratorLab";
  const description = "A guide to 12 proven prompt-writing frameworks — ORACLE, RACE, CARE, APE, CREATE, TAG, CREO, RISE, PAIN, COAST, ROSES, and RESEE — with structure, examples, and when to use each.";
  const canonical = `${SITE_URL}/prompt-frameworks/`;

  const cards = frameworks.map(f => `
      <div class="card">
        <div class="num">${f.acronym}</div>
        <h3><a href="/prompt-frameworks/${f.slug}/">${esc(f.name.split(",")[0])}${f.name.split(",").length > 1 ? "..." : ""}</a></h3>
        <p>${esc(f.tagline)}</p>
      </div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
${head({ title, description, canonical, breadcrumbLd: breadcrumbLd(crumbs) })}
<body>
${nav()}
${breadcrumbNav(crumbs)}
<header class="page-head">
  <div class="wrap">
    <div class="eyebrow">Prompt Engineering Toolkit</div>
    <h1>12 proven <span class="accent">prompt frameworks</span>, explained.</h1>
    <p class="sub">Every framework PromptGeneratorLab's generator can write in — what each one means, when to reach for it, and a bad-prompt-vs-good-prompt example for each.</p>
  </div>
</header>

<section class="tool-section">
  <div class="wrap">
    <div class="grid3">${cards}
    </div>
  </div>
</section>

<section class="info">
  <div class="wrap legal">
    <h2>Which framework should I use?</h2>
    <p>If you're not sure where to start, ORACLE is the safest general-purpose choice — it's what PromptGeneratorLab defaults to. Reach for RACE, APE, or TAG when you want something fast and the task is simple. Use CARE, COAST, or ROSES for business and strategic writing where the outcome needs to be well-defined. Use CREATE or RISE for multi-step or iterative work, CREO when your answer needs to be grounded in specific evidence, PAIN for troubleshooting and debugging, and RESEE when you're improving something you've already written rather than starting from scratch.</p>
    <p><a href="/#generator" class="cta">Try any of these frameworks in the generator →</a></p>
  </div>
</section>

${footer()}
</body>
</html>`;

  const dir = path.join(OUT_DIR, "prompt-frameworks");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

// ---------- Detail pages ----------
function buildDetail(f) {
  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Prompt Frameworks", url: "/prompt-frameworks/" },
    { name: f.acronym, url: `/prompt-frameworks/${f.slug}/` }
  ];
  const title = `${f.acronym} Prompt Framework — ${f.name} | PromptGeneratorLab`;
  const description = `${f.acronym} (${f.name}): ${f.tagline} See the structure, a bad-vs-good prompt example, and when to use it.`;
  const canonical = `${SITE_URL}/prompt-frameworks/${f.slug}/`;

  const definedTermLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": `${f.acronym} prompt framework`,
    "description": f.tagline,
    "inDefinedTermSet": `${SITE_URL}/prompt-frameworks/`
  };

  const componentRows = f.components.map(c => `
      <div class="faq-item">
        <h3>${esc(c.letter)} — ${esc(c.name)}</h3>
        <p>${esc(c.description)}</p>
      </div>`).join("");

  const related = f.related.map(slug => byslug[slug]).filter(Boolean).map(r => `
        <div class="card">
          <div class="num">${r.acronym}</div>
          <h3><a href="/prompt-frameworks/${r.slug}/">${esc(r.acronym)}</a></h3>
          <p>${esc(r.tagline)}</p>
        </div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
${head({ title, description, canonical, breadcrumbLd: breadcrumbLd(crumbs), extraLd: definedTermLd })}
<body>
${nav()}
${breadcrumbNav(crumbs)}
<header class="page-head">
  <div class="wrap">
    <div class="eyebrow">Prompt Framework</div>
    <h1>${esc(f.acronym)} <span class="accent">prompt framework</span></h1>
    <p class="sub"><strong>${esc(f.name)}</strong> — ${esc(f.tagline)}</p>
  </div>
</header>

<section class="info">
  <div class="wrap legal">
    <h2>When to use ${esc(f.acronym)}</h2>
    <p>${esc(f.whenToUse)}</p>

    <h2>The ${esc(f.acronym)} components</h2>
  </div>
  <div class="wrap">
    <div class="tool-section" style="padding-top:0;">
      ${componentRows}
    </div>
  </div>

  <div class="wrap legal">
    <h2>Bad prompt vs. ${esc(f.acronym)}-structured prompt</h2>
    <p><strong>Bad prompt:</strong></p>
    <p style="font-style:italic;">“${esc(f.badPrompt)}”</p>
    <p><strong>Structured with ${esc(f.acronym)}:</strong></p>
    <pre style="white-space:pre-wrap; background:var(--card); padding:16px; border-radius:10px; border:1px solid var(--border); font-family:'IBM Plex Mono',monospace; font-size:13.5px; line-height:1.7;">${esc(f.goodPrompt)}</pre>

    <h2>What you get back</h2>
    <p>${esc(f.exampleOutput)}</p>

    <h2>Which AI models it works well with</h2>
    <p>${esc(f.supportedModels)}</p>

    <p><a href="/?framework=${f.queryValue}#generator" class="cta">Generate a prompt with ${esc(f.acronym)} →</a></p>
  </div>
</section>

<section class="tool-section">
  <div class="wrap">
    <h2>Related frameworks</h2>
    <div class="grid3">${related}
    </div>
  </div>
</section>

${footer()}
</body>
</html>`;

  const dir = path.join(OUT_DIR, "prompt-frameworks", f.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

// ---------- Sitemap ----------
function buildSitemap() {
  const existing = [
    { loc: "/", changefreq: "weekly", priority: "1.0" },
    { loc: "/about.html", changefreq: "monthly", priority: "0.6" },
    { loc: "/faq.html", changefreq: "monthly", priority: "0.7" },
    { loc: "/examples.html", changefreq: "monthly", priority: "0.6" },
    { loc: "/contact.html", changefreq: "yearly", priority: "0.4" },
    { loc: "/privacy.html", changefreq: "yearly", priority: "0.3" },
    { loc: "/terms.html", changefreq: "yearly", priority: "0.3" },
    { loc: "/cookie-policy.html", changefreq: "yearly", priority: "0.3" },
    { loc: "/disclaimer.html", changefreq: "yearly", priority: "0.3" }
  ];
  const frameworkUrls = [
    { loc: "/prompt-frameworks/", changefreq: "monthly", priority: "0.8" },
    ...frameworks.map(f => ({ loc: `/prompt-frameworks/${f.slug}/`, changefreq: "monthly", priority: "0.7" }))
  ];
  const all = [...existing, ...frameworkUrls];
  const body = all.map(u => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "sitemap.xml"), xml);
}

// ---------- Run ----------
// Only clear this tool's own output folder — never the whole site root.
fs.rmSync(path.join(SITE_ROOT, "prompt-frameworks"), { recursive: true, force: true });
buildHub();
frameworks.forEach(buildDetail);
buildSitemap();
console.log(`Built ${frameworks.length} framework pages + hub + sitemap.xml into ${SITE_ROOT}`);
