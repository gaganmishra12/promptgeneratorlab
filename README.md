# PromptGeneratorLab

This is a full replacement for the old repo — one clean structure, no duplicate
folders. Push this as-is; delete the old repo content first.

## Structure

```
/                       ← static site — upload everything except api/ and tools/ to Hostinger's site root
  index.html, about.html, faq.html, examples.html, contact.html,
  privacy.html, terms.html, cookie-policy.html, disclaimer.html, 404.html
  css/style.css
  js/cookie-consent.js
  favicon.svg, favicon.ico, apple-touch-icon.png, icon-512.png, og-image.png
  robots.txt
  sitemap.xml
  prompt-frameworks/            ← new: 12 framework pages + hub (see below)

api/                    ← separate Node app, NOT uploaded to Hostinger static hosting.
  server.js               Deploy this wherever you're currently running the
  package.json             /api/generate backend (Render, Railway, a Hostinger
  .env.example              Node app, etc.) — same as your current setup.

tools/frameworks/       ← the generator that built prompt-frameworks/. Not part
  data/frameworks.json     of the live site. Edit the JSON, re-run the script,
  build.js                 re-upload prompt-frameworks/ + sitemap.xml.
```

## What changed vs. the old repo
- **Removed the duplicate nested `promptgeneratorlab/promptgeneratorlab/` folder** entirely — it was a stale, older copy (different `server.js`, missing several pages). This repo has one copy of everything.
- **Fixed asset paths.** Every page links `/css/style.css`, `/js/cookie-consent.js`, `/apple-touch-icon.png`, `/favicon.ico` — those files now actually exist at those exact paths (previously `apple-touch-icon.png` and `favicon.ico` didn't exist anywhere in the repo, and `style.css`/`cookie-consent.js` sat at the root instead of in `css/`/`js/`).
- **Added `/prompt-frameworks/`** — a hub page plus one page per framework (ORACLE, RACE, CARE, APE, CREATE, TAG, CREO, RISE, PAIN, COAST, ROSES, RESEE), each with real content: when to use it, a component breakdown, a bad-prompt vs. framework-structured-prompt example, and related-framework links. Included in `sitemap.xml`. Linked from every page's nav and footer.
- **Homepage generator now reads `?framework=`** from the URL, so links like `/?framework=race#generator` (used by the new framework pages' CTAs) actually preselect that framework instead of just scrolling to the generator.
- **`api/server.js`** no longer tries to serve static files (it never actually could — there was no `public/` folder for it to serve from). It now does one job: `POST /api/generate`, with CORS headers added since the API and static site may run on different hosts. Comes with its own `package.json` (the old repo only had one nested inside the stale duplicate folder) and `.env.example`.

## Deploying
1. **Static site:** upload everything at the repo root *except* `api/` and `tools/` to your Hostinger site root — same as before.
2. **API:** Hostinger's Node.js Web App deploy always looks for `package.json` at the very top of whatever you give it — it has no setting to point into a subfolder. So the `api/` folder deploys as its **own** app, separately from this repo:
   - Easiest: zip just the *contents* of `api/` (not the whole repo) and upload that archive directly via hPanel → Websites → Add Website → Node.js web app → Upload your files.
   - Or: push `api/`'s contents to their own separate GitHub repo and connect *that* repo in hPanel instead.
   Either way, set `ANTHROPIC_API_KEY` (required) and `ALLOWED_ORIGIN` (optional, defaults to `https://promptgeneratorlab.com`) as environment variables in that app — see `api/.env.example`.
3. **One thing to double-check:** the frontend calls `fetch("/api/generate")` — a relative path. That only works if requests to `/api/generate` on `promptgeneratorlab.com` get routed to the API app (e.g. a reverse-proxy/`.htaccess` rule, or a subdomain your frontend JS is updated to call). Worth confirming this routing exists once the API app is deployed and has its own URL — I don't have visibility into your hPanel to check it directly.

## Updating the framework pages later
```
cd tools/frameworks
# edit data/frameworks.json
node build.js
```
This only ever touches `prompt-frameworks/` and `sitemap.xml` — it will never delete anything else in the site root.

## Still open (not blocking, just flagging)
- Confirm the `/api/generate` routing above.
- The old sitemap only had 9 URLs; this one has 22 (9 original + hub + 12 frameworks). Submit the new `sitemap.xml` in Google Search Console after deploying.
- Next natural slice, once these are live and indexing: the 5 core model pages (`/chatgpt-prompt-generator/`, `/claude-prompt-generator/`, `/gemini-prompt-generator/`, `/ai-image-prompt-generator/`) using the same `tools/*/data.json` + `build.js` pattern.
