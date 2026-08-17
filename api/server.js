// server.js
// This is the "backend" — the only part of your app that ever touches
// your Anthropic API key. It never sends the key to the browser.

const express = require("express");

const app = express();
app.use(express.json());

// This app serves ONLY the API (POST /api/generate). All static files
// (index.html, css, js, the /prompt-frameworks/ pages, etc.) are served
// separately by Hostinger — this process doesn't touch them.

// Basic security headers (no extra dependencies needed)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// CORS: if the static site and this API end up on different hosts/ports,
// the browser needs this to allow the request. Harmless if they end up
// same-origin (e.g. Hostinger proxies /api/* to this app) — browsers only
// enforce CORS on cross-origin requests. Set ALLOWED_ORIGIN in your host's
// environment variables if it differs from the default below.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://promptgeneratorlab.com";
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// --- Simple rate limiter (no extra dependencies) ---
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const requestLog = new Map();

function rateLimiter(req, res, next) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: "Too many requests. Please wait a moment and try again."
    });
  }
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of requestLog.entries()) {
    const fresh = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (fresh.length === 0) requestLog.delete(ip);
    else requestLog.set(ip, fresh);
  }
}, 5 * 60 * 1000);

// --- Prompt framework definitions ---
const FRAMEWORKS = {
  standard: "the ORACLE framework. Structure the prompt with these labeled sections, in order: Objective, Role, Action, Context, Layout/Length, Example.",
  reasoning: "a reasoning-first structure. Structure the prompt with: Objective, Reasoning Steps (guide the AI to think step by step), Constraints, Expected Output.",
  race: "the RACE framework. Structure the prompt with: Role, Action, Context, Example.",
  care: "the CARE framework. Structure the prompt with: Context, Action, Result, Example.",
  ape: "the APE framework. Structure the prompt with: Action, Purpose, Expectation.",
  create: "the CREATE framework. Structure the prompt with: Characterise, Request, Examples, Adjust, Test, Evaluate.",
  tag: "the TAG framework. Structure the prompt with: Task, Action, Goal.",
  creo: "the CREO framework. Structure the prompt with: Context, Role, Evidence, Output.",
  rise: "the RISE framework. Structure the prompt with: Role, Input, Steps, Expectation.",
  pain: "the PAIN framework. Structure the prompt with: Problem, Action, Information, Next Steps.",
  coast: "the COAST framework. Structure the prompt with: Context, Objective, Actions, Scenario, Task.",
  roses: "the ROSES framework. Structure the prompt with: Role, Objective, Scenario, Expected Solution, Steps.",
  resee: "the RESEE framework, focused on reviewing and refining existing content. Structure the prompt with: Review, Evaluate, Suggest, Enhance, Explain."
};

const FRAMEWORK_LABELS = {
  standard: "Standard (ORACLE)", reasoning: "Reasoning", race: "RACE", care: "CARE",
  ape: "APE", create: "CREATE", tag: "TAG", creo: "CREO", rise: "RISE",
  pain: "PAIN", coast: "COAST", roses: "ROSES", resee: "RESEE"
};

const MODELS = {
  oracle: "Write the prompt in a universal style that works well with any AI model.",
  chatgpt: "Word and structure the prompt specifically to get strong results from ChatGPT.",
  claude: "Word and structure the prompt specifically to get strong results from Claude."
};

const MODEL_LABELS = {
  oracle: "Universal", chatgpt: "ChatGPT Optimised", claude: "Claude Optimised"
};

// Robustly extract the {tags, prompt} object from the AI's raw text response.
// Models occasionally wrap JSON in stray markdown fences, or fail to escape
// quotes/newlines perfectly inside long refined prompts. Instead of failing
// the whole request when that happens, we fall back to using the raw text
// as the prompt itself, so the user still gets a usable result.
function parseModelResponse(raw, fallbackLabels) {
  let text = raw.trim();
  // Strip any markdown code fences, regardless of language tag
  text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();

  // Try parsing the whole thing first
  try {
    return JSON.parse(text);
  } catch (e) {
    // Fall back to extracting the substring between the first { and last }
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (e2) {
        // Still failed — give up on structured parsing
      }
    }
  }
  // Last resort: return the raw text as the prompt so the user isn't
  // left with a blank error, and label it accordingly
  return { tags: fallbackLabels, prompt: text };
}

// This is the endpoint the browser calls when someone clicks "Generate" or "Improve Prompt"
app.post("/api/generate", rateLimiter, async (req, res) => {
  try {
    const { idea, framework, targetModel, previousPrompt, goal, audience, format, additional } = req.body;

    if (!idea || typeof idea !== "string" || !idea.trim()) {
      return res.status(400).json({ error: "Missing idea" });
    }

    const fw = FRAMEWORKS[framework] || FRAMEWORKS.standard;
    const fwLabel = FRAMEWORK_LABELS[framework] || FRAMEWORK_LABELS.standard;
    const modelInstruction = MODELS[targetModel] || MODELS.oracle;
    const modelLabel = MODEL_LABELS[targetModel] || MODEL_LABELS.oracle;

    let systemPrompt;
    let userMessage;

    if (previousPrompt) {
      systemPrompt = `You are a prompt-refining assistant. The user has an existing AI prompt and wants it improved using extra details they provide. Keep it structured using ${fw}\n${modelInstruction}\nRespond ONLY with valid, strictly-escaped JSON, no markdown fences, no preamble, in this exact shape:\n{"tags": ["${fwLabel}", "${modelLabel}"], "prompt": "the refined structured prompt"}\nInside the "prompt" string: use \\n for line breaks between sections, and escape any double quote characters as \\". Do not include literal unescaped newlines or quotes.`;
      userMessage = `Here is the current prompt:\n"""${previousPrompt}"""\n\nRefine it using these details:\nGoal: ${goal || "not specified"}\nAudience: ${audience || "not specified"}\nFormat/detail level: ${format || "not specified"}\nAdditional instructions: ${additional || "none"}`;
    } else {
      systemPrompt = `You are a prompt-writing assistant. Turn the user's rough idea into a single, ready-to-use AI prompt, structured using ${fw}\n${modelInstruction}\nRespond ONLY with valid, strictly-escaped JSON, no markdown fences, no preamble, in this exact shape:\n{"tags": ["${fwLabel}", "${modelLabel}"], "prompt": "the final structured prompt"}\nInside the "prompt" string: use \\n for line breaks between sections, and escape any double quote characters as \\". Do not include literal unescaped newlines or quotes.`;
      userMessage = `I want a prompt that will ${idea}`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(502).json({ error: "AI service error" });
    }

    const raw = data.content.map((b) => b.text || "").join("").trim();
    const parsed = parseModelResponse(raw, [fwLabel, modelLabel]);

    // Guard against a technically-valid JSON response missing expected fields
    if (!parsed.prompt) parsed.prompt = raw;
    if (!Array.isArray(parsed.tags)) parsed.tags = [fwLabel, modelLabel];

    res.json(parsed);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Any unmatched route on this app — this only serves the API, so a plain
// JSON 404 is correct (the frontend's own 404.html handles page-not-found).
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
