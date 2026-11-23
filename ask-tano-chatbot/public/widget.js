/*  TanoLLM chat widget
 *  Paste ONE line into Cargo (Site Settings → CSS / HTML → HTML):
 *    <script src="https://ask-tano-chatbot.vercel.app/widget.js" defer></script>
 *
 *  Optional settings, as attributes on that same script tag:
 *    data-theme="dark" | "light"      default: dark
 *    data-position="left" | "right"   which side the column overlay and pill sit on (default: left)
 *    data-open="true"                 start opened
 */
(function () {
  if (window.__askTanoLoaded) return; // Cargo can re-run scripts between pages
  window.__askTanoLoaded = true;

  var script = document.currentScript;
  var d = (script && script.dataset) || {};
  var API = (d.api || new URL(script.src).origin) + "/api/chat";
  var THEME = d.theme === "light" ? "light" : "dark";
  var SIDE = d.position === "right" ? "right" : "left";

  // ── Design settings: edit these ─────────────────────────────────────────────
  var NAME = "TanoLLM";               // name in the header and greeting
  var LABEL = "Ask TanoLLM";          // text on the launcher pill
  var DOT_COLOR = "#e47bf9";          // the little status dot
  var DOT_DARK = "#a24db5";           // darker purple the dot flickers to on hover
  var DOT_LIGHT = "#f4c2fc";
  var EDGE = "1.5rem";                // padding, matches Cargo's 1.5
  var COLUMN_WIDTH = "22.33vw";       // overlay width, matches your index column (max-width: 22.33%)
  var MOBILE_BREAK = 768;             // below this screen width, the overlay goes full width
  var RADIUS = "0";                   // corner rounding of pill, input and buttons: "0" = rectangular
  var BRAND_FONT = '"Monument Grotesk", "Monument Grotesk Variable", "ABC Monument Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif';

  // The "TanoLLM" title in the panel header.
  // TITLE_FONT tries Monument Grotesk Mono first; if your Cargo site doesn't load it, it falls back to BRAND_FONT.
  var TITLE_FONT = '"Monument Grotesk Mono", "ABC Monument Grotesk Mono", "Monument Grotesk Mono Variable", ' + BRAND_FONT;
  var TITLE_UPPERCASE = true;         // true = TANOLLM, false = TanoLLM
  var TITLE_SIZE = "1.1rem";
  var TITLE_WEIGHT = "700";          // 700 = bold, 400 = regular
  var TITLE_TRACKING = "0.04em";      // letter spacing

  // Text sizes use Cargo's own units (rem), so 1.1 here = 1.1 in Cargo and scales the same way.
  var BODY_SIZE = "1.1rem";           // answers, questions, suggestions, input (matches your body text)
  var BODY_LINE_HEIGHT = "1.35";
  var GREETING_SIZE = "1.6rem";       // "Hey there, I'm TanoLLM."

  // Nudges the text inside the input box up (positive) or down (negative) to center it.
  var INPUT_TEXT_NUDGE = 5;           // in pixels

  // Nudges the pink dot up (positive) or down (negative) to center it on the text.
  var DOT_NUDGE = -0.5;               // on the "Ask TanoLLM" button, in pixels
  var TITLE_DOT_NUDGE = 2.5;          // next to "TanoLLM" at the top of the overlay, in pixels

  // Launcher pill text. PILL_TEXT_NUDGE moves the label down (positive) or up (negative)
  // so the top and bottom padding look equal.
  var PILL_FONT = TITLE_FONT;         // mono, same as the title
  var PILL_SIZE = TITLE_SIZE;        // same size as the TANOLLM title
  var PILL_TEXT_NUDGE = 2;            // in pixels

  // Your question bubble. Q_TEXT_NUDGE moves the text down (positive) or up (negative) inside it.
  var Q_PADDING = 14;                 // in pixels, all sides
  var Q_TEXT_NUDGE = 1;               // in pixels

  var GAP_ABOVE_INPUT = 32;           // space between the last line of the conversation and the input box, in pixels

  var GREETING = "Hey there, I'm " + NAME + ".";
  var SUGGESTIONS = [
    "What kind of designer is tano?",
    "Tell me about Espial Industries",
    "What tools does tano use?",
  ];
  var PLACEHOLDER = "Ask about tano\u2026";

  var css = `
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .wrap {
      /* dark mode: matches tanodsgn.com */
      --bg: #191919; --fg: rgba(255,255,255,.85); --mute: rgba(255,255,255,.4); --line: rgba(255,255,255,.12);
      --field: rgba(255,255,255,.07); --pill-bg: #191919; --pill-fg: #ffffff; --pill-line: rgba(255,255,255,.12);
      --glitch-hi: #ffffff; --glitch-lo: rgba(255,255,255,.25); --icon-end: rgba(255,255,255,.85);
      font: ${BODY_SIZE}/${BODY_LINE_HEIGHT} ${BRAND_FONT};
      color: var(--fg); -webkit-font-smoothing: antialiased;
    }
    /* light mode: follows html[data-theme="light"] on tanodsgn.com */
    .wrap.light {
      --bg: #D9D9D9; --fg: rgba(25,25,25,.9); --mute: rgba(25,25,25,.55); --line: rgba(25,25,25,.15);
      --field: rgba(25,25,25,.07); --pill-bg: #D9D9D9; --pill-fg: #191919; --pill-line: #919191;
      --glitch-hi: #e78cf9; --glitch-lo: #9d649f; --icon-end: #e78cf9;
    }
    .wrap, .wrap * { transition: background-color .4s ease, color .4s ease, border-color .4s ease; }
    /* no fades on anything that glitches, so the flicker stays a hard cut */
    .tools button, .tools svg, .tools svg *, .dot, .launcher, .launcher::after, .send, .send svg, .send svg * { transition: none; }

    button { all: unset; cursor: pointer; }
    button:focus-visible { outline: 1px solid var(--fg); outline-offset: 2px; }

    /* Launcher pill */
    .launcher {
      position: fixed; bottom: ${EDGE}; ${SIDE}: ${EDGE}; z-index: 2147483000;
      display: inline-flex; align-items: center; gap: 10px;
      background: var(--pill-bg); color: var(--pill-fg); border: 1px solid var(--pill-line);
      padding: 12px 16px 12px 14px; border-radius: ${RADIUS};
      font: 500 ${PILL_SIZE}/1 ${PILL_FONT}; letter-spacing: ${TITLE_TRACKING}; word-spacing: .12em; text-transform: uppercase;
    }
    /* Glitch hover, same as the buttons on tanodsgn.com (.button-14) */
    .launcher, .send { position: relative; overflow: hidden; }
    .launcher { position: fixed; }
    .launcher::after, .send::after {
      content: ""; position: absolute; inset: 0; pointer-events: none; background-color: rgba(255,255,255,0);
    }
    /* keep the pill's dot and text above the glitch layer, so the text stays white */
    .launcher > * { position: relative; z-index: 1; }
    .launcher::after { z-index: 0; }
    .launcher:hover::after, .launcher:focus-visible::after { animation: glitch-pill .45s steps(1, end) forwards; }
    .light .launcher:hover::after, .light .launcher:focus-visible::after { animation: glitch-pill-light .45s steps(1, end) forwards; }
    .send:not(:disabled):hover::after, .send:focus-visible::after { animation: glitch-dark .45s steps(1, end) forwards; }
    .launcher:hover .dot, .launcher:focus-visible .dot { animation: glitch-dot .45s steps(1, end) forwards; }
    /* start-over and close: only the icon glitches, no box */
    .tools button:hover, .tools button:focus-visible { animation: glitch-icon .45s steps(1, end) forwards; }

    @keyframes glitch-dark {
      0%   { background-color: rgba(255, 255, 255, 0); }
      10%  { background-color: rgba(255, 255, 255, 0.35); }
      20%  { background-color: rgba(0, 0, 0, 0.35); }
      30%  { background-color: rgba(255, 255, 255, 0.3); }
      40%  { background-color: rgba(0, 0, 0, 0.4); }
      52%  { background-color: rgba(255, 255, 255, 0.22); }
      62%  { background-color: rgba(0, 0, 0, 0.35); }
      75%  { background-color: rgba(255, 255, 255, 0.12); }
      85%  { background-color: rgba(0, 0, 0, 0.3); }
      100% { background-color: rgba(0, 0, 0, 0.3); }
    }
    /* same flicker, settling on #777777 at 30% */
    @keyframes glitch-pill {
      0%   { background-color: rgba(255, 255, 255, 0); }
      10%  { background-color: rgba(255, 255, 255, 0.35); }
      20%  { background-color: rgba(0, 0, 0, 0.35); }
      30%  { background-color: rgba(255, 255, 255, 0.3); }
      40%  { background-color: rgba(0, 0, 0, 0.4); }
      52%  { background-color: rgba(255, 255, 255, 0.22); }
      62%  { background-color: rgba(0, 0, 0, 0.35); }
      75%  { background-color: rgba(255, 255, 255, 0.12); }
      85%  { background-color: rgba(119, 119, 119, 0.3); }
      100% { background-color: rgba(119, 119, 119, 0.3); }
    }
    /* light mode pill: flickers through greys, settles on #919191 */
    @keyframes glitch-pill-light {
      0%   { background-color: rgba(191, 191, 191, 0); }
      10%  { background-color: #a6a6a6; }
      20%  { background-color: #ededed; }
      30%  { background-color: #8c8c8c; }
      40%  { background-color: #e3e3e3; }
      52%  { background-color: #9e9e9e; }
      62%  { background-color: #d2d2d2; }
      75%  { background-color: #b3b3b3; }
      85%  { background-color: #919191; }
      100% { background-color: #919191; }
    }
    /* dot flickers between darker and lighter purple, no movement */
    @keyframes glitch-dot {
      0%   { background-color: ${DOT_COLOR}; }
      10%  { background-color: ${DOT_DARK}; }
      20%  { background-color: ${DOT_COLOR}; }
      30%  { background-color: ${DOT_DARK}; }
      40%  { background-color: ${DOT_COLOR}; }
      52%  { background-color: ${DOT_DARK}; }
      62%  { background-color: ${DOT_COLOR}; }
      75%  { background-color: ${DOT_DARK}; }
      100% { background-color: ${DOT_COLOR}; }
    }
    /* icons flash like the links on your site: color only, no movement */
    @keyframes glitch-icon {
      0%  { color: var(--glitch-hi); }
      10% { color: var(--glitch-lo); }
      20% { color: var(--glitch-hi); }
      30% { color: var(--glitch-lo); }
      42% { color: var(--glitch-hi); }
      55% { color: var(--glitch-lo); }
      68% { color: var(--glitch-hi); }
      82% { color: var(--glitch-lo); }
      100% { color: var(--icon-end); }
    }
    .launcher[hidden] { display: none; }
    /* Trim the font's built-in space above/below the letters so text centers optically */
    .trim { display: block; line-height: 1; text-box: trim-both cap alphabetic; }
    .launcher .trim { transform: translateY(${PILL_TEXT_NUDGE}px); }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: ${DOT_COLOR}; flex: none; transform: translateY(${-DOT_NUDGE}px); }
    .launcher .dot { animation: pulse 2.4s infinite; }
    .title .dot { transform: translateY(${-TITLE_DOT_NUDGE}px); }
    @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }

    /* Column overlay */
    .panel {
      position: fixed; top: 0; bottom: 0; ${SIDE}: 0; z-index: 2147483001;
      width: ${COLUMN_WIDTH}; min-width: 280px;
      background: var(--bg);
      padding: ${EDGE}; display: flex; flex-direction: column;
      animation: slide .25s ease;
    }
    .panel[hidden] { display: none; }
    @keyframes slide { from { opacity: 0; transform: translateX(${SIDE === "left" ? "-12px" : "12px"}) } to { opacity: 1; transform: none } }

    header { display: flex; align-items: center; justify-content: space-between; flex: none; }
    .title { display: flex; align-items: center; gap: 9px; font-family: ${TITLE_FONT}; font-size: ${TITLE_SIZE}; font-weight: ${TITLE_WEIGHT};
             letter-spacing: ${TITLE_TRACKING}; text-transform: ${TITLE_UPPERCASE ? "uppercase" : "none"}; }
    .tools { display: flex; gap: 14px; color: var(--mute); }
    .tools button { width: 20px; height: 20px; display: grid; place-items: center; }
    .tools button:hover { color: var(--icon-end); }

    /* Conversation */
    .log { flex: 1; min-height: 0; overflow-y: auto; position: relative; display: flex; flex-direction: column;
           padding: 24px 0 ${GAP_ABOVE_INPUT}px; scrollbar-width: none; }
    .log::-webkit-scrollbar { display: none; }
    .intro { margin-top: auto; display: flex; flex-direction: column; gap: 18px; }
    .greet { font-size: ${GREETING_SIZE}; line-height: 1.2; letter-spacing: -.01em; }
    .turn { display: flex; flex-direction: column; gap: 18px; flex: none; }
    .turn + .turn { padding-top: 28px; }
    /* Your question: a right-aligned bubble, like a text message */
    .q { align-self: flex-end; max-width: 85%; background: var(--field); border-radius: ${RADIUS};
         padding: ${Q_PADDING + Q_TEXT_NUDGE}px ${Q_PADDING}px ${Q_PADDING - Q_TEXT_NUDGE}px;
         text-box: trim-both cap alphabetic; white-space: pre-wrap; word-wrap: break-word; }
    .a { white-space: pre-wrap; word-wrap: break-word; }
    .a.typing:empty::after, .a.typing::after { content: "\\258D"; animation: blink 1s steps(1) infinite; color: var(--mute); }
    @keyframes blink { 50% { opacity: 0 } }
    .follow { border-top: 1px solid var(--line); padding-top: 16px; display: flex; flex-direction: column; gap: 12px;
              animation: fade .35s ease; }
    @keyframes fade { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }

    .chips { display: flex; flex-direction: column; gap: 12px; }
    .chip { color: var(--mute); display: flex; align-items: baseline; gap: 8px; }
    .chip::before { content: "\\21B3"; flex: none; }
    .chip:hover { color: var(--fg); }

    /* Input */
    form { flex: none; display: flex; align-items: center; gap: 8px;
           background: var(--field); border-radius: ${RADIUS}; padding: 4px 6px 4px 14px; }
    textarea { flex: 1; resize: none; border: 0; background: transparent; color: var(--fg);
               font: inherit; max-height: 120px; outline: none; display: block;
               padding: ${10 - INPUT_TEXT_NUDGE}px 0 ${10 + INPUT_TEXT_NUDGE}px;
               overflow-y: hidden; scrollbar-width: none; }
    textarea::-webkit-scrollbar { display: none; }
    textarea::placeholder { color: var(--mute); }
    .send { width: 32px; height: 32px; display: grid; place-items: center; color: var(--fg);
            border-radius: ${RADIUS}; flex: none; }
    .send:disabled { color: var(--mute); opacity: .6; cursor: default; }

    @media (max-width: ${MOBILE_BREAK}px) { .panel { width: 100vw; min-width: 0; } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
  `;

  var ICON_RESET = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4M2.5 2.5v3h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_CLOSE = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2 2 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  var ICON_SEND = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12V2M2.5 6.5 7 2l4.5 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var host = document.createElement("div");
  host.id = "ask-tano";
  var root = host.attachShadow({ mode: "open" });
  root.innerHTML =
    "<style>" + css + "</style>" +
    '<div class="wrap ' + THEME + '">' +
    '  <aside class="panel" role="dialog" aria-label="' + esc(NAME) + '" hidden>' +
    '    <header><span class="title"><span class="dot"></span><span class="trim">' + esc(NAME) + "</span></span>" +
    '      <span class="tools"><button class="reset" aria-label="Start over">' + ICON_RESET + "</button>" +
    '      <button class="x" aria-label="Close">' + ICON_CLOSE + "</button></span></header>" +
    '    <div class="log" aria-live="polite"></div>' +
    "    <form>" +
    '      <textarea rows="1" maxlength="600" placeholder="' + esc(PLACEHOLDER) + '" aria-label="Your message"></textarea>' +
    '      <button class="send" type="submit" aria-label="Send" disabled>' + ICON_SEND + "</button>" +
    "    </form>" +
    "  </aside>" +
    '  <button class="launcher" aria-expanded="false"><span class="dot"></span><span class="trim">' + esc(LABEL) + "</span></button>" +
    "</div>";
  document.body.appendChild(host);

  var $ = function (s) { return root.querySelector(s); };
  var panel = $(".panel"), launcher = $(".launcher"), log = $(".log");
  var form = $("form"), input = $("textarea"), send = $(".send");
  var history = []; // [{role, content}]
  var busy = false;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var MARKER = "%%FOLLOWUPS%%";
  var asked = [];

  function chipList(questions) {
    var wrap = document.createElement("div");
    wrap.className = "chips";
    questions.forEach(function (q) {
      var btn = document.createElement("button");
      btn.className = "chip"; btn.type = "button"; btn.textContent = q;
      btn.onclick = function () { ask(q); };
      wrap.appendChild(btn);
    });
    return wrap;
  }

  // Text load-in: letters cycle through random characters, then settle left to right.
  var SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>[]_-";
  var SCRAMBLE_MS = 900;              // total load-in time
  function scramble(el, text) {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = text; return; }
    var t0 = performance.now();
    (function frame(now) {
      var p = Math.min(1, (now - t0) / SCRAMBLE_MS);
      var settled = Math.floor(p * text.length);
      var out = "";
      for (var i = 0; i < text.length; i++) {
        var c = text[i];
        out += (i < settled || c === " ") ? c : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      el.textContent = out;
      if (p < 1 && el.isConnected) requestAnimationFrame(frame);
      else el.textContent = text;
    })(t0);
  }

  // Before the first question: greeting + starter questions, sitting at the bottom.
  function start() {
    history = []; asked = [];
    log.innerHTML = "";
    var intro = document.createElement("div");
    intro.className = "intro";
    var g = document.createElement("div");
    g.className = "greet";
    intro.appendChild(g);
    intro.appendChild(chipList(SUGGESTIONS));
    log.appendChild(intro);
    scramble(g, GREETING);
  }

  function setOpen(open, fromKeyboard) {
    panel.hidden = !open;
    launcher.hidden = open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) {
      if (!log.children.length) start();
      setTimeout(function () { input.focus(); }, 50);
    } else if (fromKeyboard) {
      launcher.focus(); // only move focus back for keyboard users, so no focus ring after a mouse click
    }
  }

  // Split the raw reply into the visible answer and the follow-up questions.
  function parse(raw) {
    var i = raw.indexOf("%%");
    var text = (i >= 0 ? raw.slice(0, i) : raw).replace(/\s+$/, "");
    var follow = [];
    var m = raw.indexOf(MARKER);
    if (m >= 0) {
      follow = raw.slice(m + MARKER.length).split("\n")
        .map(function (l) { return l.replace(/^[\s\-\u2022\d.)]+/, "").trim(); })
        .filter(function (l) { return l && l.length < 120; })
        .slice(0, 3);
    }
    return { text: text, follow: follow };
  }

  async function ask(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    input.value = ""; resize(); send.disabled = true;

    // After the first question the greeting goes away.
    var intro = log.querySelector(".intro");
    if (intro) intro.remove();
    // Old follow-up lists go away too; earlier answers stay above for scrolling back.
    log.querySelectorAll(".follow").forEach(function (f) { f.remove(); });
    log.querySelectorAll(".turn").forEach(function (t) { t.style.minHeight = ""; });

    var turn = document.createElement("div");
    turn.className = "turn";
    var q = document.createElement("div");
    q.className = "q"; q.textContent = text;
    var out = document.createElement("div");
    out.className = "a typing";
    turn.appendChild(q); turn.appendChild(out);
    log.appendChild(turn);
    // Give the new turn a full screen of room so the question can sit at the top.
    turn.style.minHeight = (log.clientHeight - 24 - GAP_ABOVE_INPUT + (q.offsetTop - turn.offsetTop)) + "px";
    log.scrollTo({ top: q.offsetTop - 24, behavior: "smooth" });

    asked.push(text);
    history.push({ role: "user", content: text });
    var raw = "", parsed = { text: "", follow: [] };
    try {
      var res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        raw = (await res.text()) || "Something went wrong. Try again in a moment.";
      } else {
        var reader = res.body.getReader(), dec = new TextDecoder();
        while (true) {
          var r = await reader.read();
          if (r.done) break;
          raw += dec.decode(r.value, { stream: true });
          out.textContent = parse(raw).text; // answer reveals top to bottom as it's written
        }
      }
    } catch (e) {
      raw = "Couldn't reach " + NAME + ". Check your connection and try again.";
    }
    parsed = parse(raw);
    out.textContent = parsed.text;
    out.classList.remove("typing");
    if (parsed.text) history.push({ role: "assistant", content: parsed.text });
    else history.pop();

    // Follow-up questions under the answer (falls back to unused starters).
    var notAsked = function (s2) { return asked.indexOf(s2) < 0; };
    var follow = parsed.follow.filter(notAsked);
    if (!follow.length) follow = SUGGESTIONS.filter(notAsked).slice(0, 3);
    if (follow.length) {
      var f = document.createElement("div");
      f.className = "follow";
      f.appendChild(chipList(follow));
      turn.appendChild(f);
    }
    busy = false;
    input.focus();
  }

  function resize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
    input.style.overflowY = input.scrollHeight > 120 ? "auto" : "hidden"; // only scroll for very long messages
  }

  launcher.onclick = function () { setOpen(true); };
  $(".x").onclick = function () { setOpen(false); };
  $(".reset").onclick = function () { if (!busy) { start(); input.focus(); } };
  input.addEventListener("input", function () { resize(); send.disabled = !input.value.trim() || busy; });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); }
  });
  root.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false, true); });
  form.onsubmit = function (e) { e.preventDefault(); ask(input.value); };

  // Follow the site's light/dark toggle (html data-theme="light"), unless data-theme is set on the script tag.
  var wrapEl = $(".wrap");
  function syncTheme() {
    var light = d.theme ? d.theme === "light" : document.documentElement.getAttribute("data-theme") === "light";
    wrapEl.classList.toggle("light", light);
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  if (d.open === "true") setOpen(true);
})();
