// POST /api/chat
// Receives the visitor's conversation from the widget, asks Claude, and streams
// the reply back as plain text. Your API key never leaves this server.

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "../lib/system-prompt.js";

// ── Settings you might tweak ────────────────────────────────────────────────
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const MAX_REPLY_TOKENS = 1500;      // hard ceiling per answer (includes the model's thinking)
const MAX_MESSAGE_CHARS = 600;      // longest message a visitor can send
const MAX_TURNS = 12;               // how much conversation history we send back to Claude
const RATE_LIMIT = 15;              // messages per visitor...
const RATE_WINDOW_MS = 60 * 60_000; // ...per hour

// Sites allowed to talk to this API. Set ALLOWED_ORIGINS in Vercel to override,
// comma-separated, e.g. "https://tanodsgn.com,https://www.tanodsgn.com"
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  "https://tanodsgn.com,https://www.tanodsgn.com"
)
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from Vercel's env vars

// The widget hides everything after this marker and shows it as clickable follow-up questions.
const FOLLOWUP_MARKER = "%%FOLLOWUPS%%";
const FOLLOWUP_INSTRUCTIONS = `
Project cards: if your answer is mainly about one or two of the five portfolio projects, add a line
after the answer with %%PROJECT:id%% for each (at most two), using these ids: espial (Espial Industries),
uscs (U.S. Cargo Systems), cutlass (Cutlass Music Group), wbc (World Baseball Classic: Pool C),
pit26 (PIT-26). The site shows these as clickable thumbnails, so don't paste the project's link yourself.
Skip this line when no single project is the focus.
Also use %%PROJECT:chess%% (TANOMATE, the chess bot that plays like Chris) whenever chess comes up, or when
the visitor asks what he does for fun, about games, or wants a challenge. Then end your answer by inviting
them to play him, in one short line.

After every answer, add a new line containing exactly ${FOLLOWUP_MARKER}, then exactly three short
follow-up questions a visitor might ask next, one per line, no numbering or bullets.
Write them as the visitor would ask them, under 60 characters each, and only about things your notes
can answer. Mostly about Chris's projects, experience, process and the roles he's looking for; suggest
personal ones (music, sports, influences) only if the visitor has been asking about him as a person.
Make them varied, refer to Chris by name or as "he", and don't repeat questions already asked.`;

// ── Basic rate limit (per server instance) ──────────────────────────────────
// Good enough to stop one person spamming. The real cost cap is the monthly
// spend limit you set in the Claude Console (see the walkthrough).
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return recent.length > RATE_LIMIT;
}

// Allowed = listed in ALLOWED_ORIGINS, or the Vercel site itself (so the test page works).
function isAllowed(origin, request) {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  const host = request.headers.get("host");
  return Boolean(host) && origin === `https://${host}`;
}

function corsHeaders(origin, request) {
  const h = { Vary: "Origin" };
  if (isAllowed(origin, request)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type";
    h["Access-Control-Max-Age"] = "86400";
  }
  return h;
}

function reply(status, text, headers) {
  return new Response(text, {
    status,
    headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Keep only well-formed user/assistant text turns, trimmed to our limits.
function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS * 4) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift(); // must start with user
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  if (msgs[msgs.length - 1].content.length > MAX_MESSAGE_CHARS) return null;
  return msgs;
}

export function OPTIONS(request) {
  const origin = request.headers.get("origin") || "";
  return new Response(null, { status: 204, headers: corsHeaders(origin, request) });
}

export async function POST(request) {
  const origin = request.headers.get("origin") || "";
  const cors = corsHeaders(origin, request);
  if (!isAllowed(origin, request)) return reply(403, "Not allowed.", cors);

  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) {
    return reply(429, "That's the limit for now. Try again in an hour, or reach Chris directly at cdegaetadesign@gmail.com.", cors);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return reply(400, "Bad request.", cors);
  }
  const messages = cleanMessages(body?.messages);
  if (!messages) {
    return reply(400, `Messages must be text under ${MAX_MESSAGE_CHARS} characters.`, cors);
  }

  // Stream Claude's answer straight through to the visitor as it's written.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claude = client.beta.messages.stream({
          model: MODEL,
          max_tokens: MAX_REPLY_TOKENS,
          output_config: { effort: "low" }, // short, fast, cheap answers suit a chat widget
          // Prompt caching: your bio is identical for every visitor, so Claude keeps it ready for 5 minutes
          // and repeat reads cost about a tenth. Answers are exactly the same either way.
          system: [{ type: "text", text: SYSTEM_PROMPT + "\n" + FOLLOWUP_INSTRUCTIONS, cache_control: { type: "ephemeral" } }],
          messages,
          // If the model declines a message for safety reasons, retry on a fallback model.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
        });
        for await (const event of claude) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await claude.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("I can't help with that one. Ask me about Chris's work instead."));
        }
      } catch (err) {
        console.error("Claude error:", err?.status, err?.message);
        const msg =
          err instanceof Anthropic.RateLimitError
            ? "Lots of visitors right now. Try again in a minute."
            : "Something went wrong on my end. You can always email cdegaetadesign@gmail.com.";
        controller.enqueue(encoder.encode(msg));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...cors,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}


