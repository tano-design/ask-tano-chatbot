/*  TanoLLM chat widget
 *  Paste ONE line into Cargo (Site Settings → CSS / HTML → HTML):
 *    <script src="https://ask-tano-chatbot.vercel.app/widget.js" defer></script>
 *
 *  Optional settings, as attributes on that same script tag:
 *    data-theme="dark" | "light"      default: dark
 *    data-position="left" | "right"   which side the column overlay and pill sit on (default: left)
 *    data-open="true"                 start opened
 *
 *  Embed the chat inside a page (used for the mobile About page): put this in the page's code view
 *    <div data-tanollm data-height="75vh"></div>
 *  Open the chat from your own button or icon: link it to #tanollm (or /tanollm), give the image
 *  the alt text "tanollm", the class "tanollm-open", or the attribute data-tanollm-open.
 *  On phones it opens full screen and slides up from the bottom (slides back down on close).
 *  Phones (below MOBILE_BREAK) never show the floating pill.
 *  Google Analytics: if the site has GA, the widget sends tanollm_open, tanollm_question, tanollm_reset
 *  and tanollm_project_click events.
 */
(function () {
  if (window.__askTanoLoaded) return; // Cargo can re-run scripts between pages
  window.__askTanoLoaded = true;

  var script = document.currentScript;
  var d = (script && script.dataset) || {};
  var BASE = d.api || new URL(script.src).origin;
  var API = BASE + "/api/chat";
  var THEME = d.theme === "light" ? "light" : "dark";
  var SIDE = d.position === "right" ? "right" : "left";

  // ── Design settings: edit these ─────────────────────────────────────────────
  var NAME = "TanoLLM";               // name in the header and greeting
  var LABEL = "Ask TanoLLM";          // text on the launcher pill
  var DOT_COLOR = "#e47bf9";          // the little status dot
  var DOT_DARK = "#a24db5";           // darker purple the dot flickers to on hover
  var DOT_LIGHT = "#f4c2fc";
  var EDGE = "1.5rem";                // padding, matches Cargo's 1.5
  var COLUMN_WIDTH = "21.83vw";       // overlay width, matches your index column (max-width: 22.33%)
  var SLIDE_MS = 380;                 // phone slide-up / slide-down time, in milliseconds
  var MOBILE_BREAK = 768;             // below this screen width: no floating pill, overlay goes full width
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
  var GREETING_SIZE = "1.6rem";       // "What's up? I'm TanoLLM."

  // Nudges the text inside the input box up (positive) or down (negative) to center it.
  var INPUT_TEXT_NUDGE = 5;           // in pixels

  // Phone-only versions of the nudges above (phones render fonts a little differently).
  // Positive moves up, negative moves down, half pixels work.
  var MOBILE_TITLE_DOT_NUDGE = 0.5;   // purple dot next to TANOLLM
  var MOBILE_INPUT_TEXT_NUDGE = 1;    // "Ask about Chris..." text inside the input box
  // Your mobile icon, found by its Cargo image id, so it works without any link or class on it.
  // If you swap the icon image, copy the new hash="..." from Cargo's code view into here.
  var ICON_SELECTOR = 'media-item[hash="Y3244933181303926924160182603586"]';
  var MOBILE_TAP_SIZE = 40;           // tap area of the X and refresh buttons on phones, in pixels

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

  var GREETING = "What's up? I'm " + NAME + ".";
  // Project cards: when the bot talks about one of these, a clickable card shows under the answer.
  // thumb is a file in public/thumbs on Vercel (or any full image URL).
  var PROJECTS = {
    espial:  { title: "Espial Industries",   url: "https://tanodsgn.com/portfolio#espial-industries", thumb: "thumbs/espial.jpg" },
    uscs:    { title: "U.S. Cargo Systems",  url: "https://tanodsgn.com/us-cargo-systems",            thumb: "thumbs/uscs.jpg" },
    cutlass: { title: "Cutlass Music Group", url: "https://tanodsgn.com/cutlass-music-group",         thumb: "thumbs/cutlass.jpg" },
    wbc:     { title: "WBC: Pool C",         url: "https://tanodsgn.com/world-baseball-classic",      thumb: "thumbs/wbc.jpg" },
    pit26:   { title: "PIT-26",              url: "https://tanodsgn.com/pit-26",                      thumb: "thumbs/pit26.jpg" },
    // TANOBOT, the chess easter egg. Change url if the chess page has a different address.
    chess:   { title: "TANOBOT",             url: "https://tanodsgn.com/chess",                       thumb: "thumbs/chess.jpg", cta: "Play him \u2197" },
  };

  // Secret code words: typing one of these (on its own) skips the AI and challenges the visitor to chess.
  var CHESS_CODE_WORDS = ["e4", "1.e4", "checkmate"];
  var CHESS_SECRET_REPLY = "e5. Bold opening. Want a real game? TANOBOT plays like Chris: his openings, his instincts, his blunders. Built from 598 of his chess.com games.";

  var SUGGESTIONS = [
    "What kind of roles is Chris looking for?",
    "Walk me through Espial Industries",
    "What did he do at U.S. Cargo Systems?",
  ];
  var PLACEHOLDER = "Ask about Chris\u2026";

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
      --field: rgba(25,25,25,.07); --pill-bg: #D9D9D9; --pill-fg: #191919; --pill-line: #AEAEAE;
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
    /* light mode pill: flickers through greys, settles on #AEAEAE */
    @keyframes glitch-pill-light {
      0%   { background-color: rgba(191, 191, 191, 0); }
      10%  { background-color: #a6a6a6; }
      20%  { background-color: #ededed; }
      30%  { background-color: #8c8c8c; }
      40%  { background-color: #e3e3e3; }
      52%  { background-color: #9e9e9e; }
      62%  { background-color: #d2d2d2; }
      75%  { background-color: #b3b3b3; }
      85%  { background-color: #AEAEAE; }
      100% { background-color: #AEAEAE; }
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
    /* Project cards */
    .cards { display: flex; flex-direction: column; gap: 10px; animation: fade .35s ease; }
    .card { display: flex; align-items: center; gap: 12px; padding: 8px; border: 1px solid var(--line);
            border-radius: ${RADIUS}; color: var(--fg); text-decoration: none; }
    .card img { width: 96px; aspect-ratio: 16 / 9; object-fit: cover; display: block; flex: none; border-radius: ${RADIUS}; }
    .card .ct { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .card .cn { font-family: ${TITLE_FONT}; font-weight: ${TITLE_WEIGHT}; text-transform: uppercase; letter-spacing: ${TITLE_TRACKING};
                font-size: .85em; line-height: 1.1; }
    .card .cv { color: var(--mute); font-size: .85em; line-height: 1.1; }
    .card:hover { background: var(--field); }
    .card:hover .cv { color: var(--fg); }
    .a a { color: inherit; text-decoration: underline; text-underline-offset: 2px; text-decoration-color: var(--mute); }
    .a a:hover { text-decoration-color: currentColor; }
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

    /* Phones: full screen, slides up from the bottom */
    @media (max-width: ${MOBILE_BREAK}px) {
      .panel { left: 0; right: 0; top: 0; bottom: auto; width: 100%; min-width: 0;
               height: 100vh; height: 100dvh;
               padding: calc(${EDGE} + env(safe-area-inset-top)) ${EDGE} calc(${EDGE} + env(safe-area-inset-bottom));
               animation: slide-up ${SLIDE_MS}ms cubic-bezier(.22, 1, .36, 1); will-change: transform; }
      .panel.closing { animation: slide-down ${SLIDE_MS}ms cubic-bezier(.55, 0, .78, .2) forwards; }
      .launcher { display: none; }
      .title .dot { transform: translateY(${-MOBILE_TITLE_DOT_NUDGE}px); }
      textarea { padding: ${10 - MOBILE_INPUT_TEXT_NUDGE}px 0 ${10 + MOBILE_INPUT_TEXT_NUDGE}px; }
      /* Bigger, easier-to-tap X and refresh; negative margin keeps the X lined up with the right edge */
      .tools { gap: 2px; margin: ${-(MOBILE_TAP_SIZE - 20) / 2}px ${-(MOBILE_TAP_SIZE - 20) / 2}px; }
      .tools button { width: ${MOBILE_TAP_SIZE}px; height: ${MOBILE_TAP_SIZE}px; }
      .tools .reset svg { width: 21px; height: 21px; }
      .tools .x svg { width: 19px; height: 19px; }
    }
    @keyframes slide-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
    @keyframes slide-down { from { transform: translateY(0) } to { transform: translateY(100%) } }
    /* Embedded in a page (div data-tanollm): sits in the page instead of floating */
    .inline .panel { position: relative; top: auto; bottom: auto; left: auto; right: auto; z-index: auto;
                     width: 100%; min-width: 0; height: var(--inline-h, 75vh); padding: 0; animation: none; }
    .inline .launcher, .inline .x { display: none; }
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
  var history = []; // [{role, content}] sent to Claude
  var turns = [];   // [{q, a, projects}] what's on screen, saved so the chat survives page loads
  var lastFollow = [];
  var busy = false;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  var MARKER = "%%FOLLOWUPS%%";
  var asked = [];

  function chipList(questions, source) {
    var wrap = document.createElement("div");
    wrap.className = "chips";
    questions.forEach(function (q) {
      var btn = document.createElement("button");
      btn.className = "chip"; btn.type = "button"; btn.textContent = q;
      btn.onclick = function () { ask(q, source); };
      wrap.appendChild(btn);
    });
    return wrap;
  }

  // Text load-in: starts scrambled, then settles left to right into the real text.
  // Each letter sits in a box locked to the width of its real letter and words can't break,
  // so the scrambled text takes exactly the same space: no extra lines, no shifting spacing.
  var SCR_UP = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", SCR_LO = "abcdefghijklmnopqrstuvwxyz", SCR_NUM = "0123456789";
  var SCRAMBLE_MS = 900;              // total load-in time
  function scrChar(c) {
    var pool = /[0-9]/.test(c) ? SCR_NUM : /[A-Z]/.test(c) ? SCR_UP : /[a-z]/.test(c) ? SCR_LO : "";
    return pool ? pool[Math.floor(Math.random() * pool.length)] : c;
  }
  function scramble(el, text) {
    if (el._scr) cancelAnimationFrame(el._scr);
    if ((window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || !el.isConnected) { el.textContent = text; return; }
    el.textContent = "";
    var boxes = [];
    text.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (!part.trim()) { el.appendChild(document.createTextNode(part)); return; }
      var word = document.createElement("span");
      word.style.whiteSpace = "nowrap";
      Array.from(part).forEach(function (c) {
        var b = document.createElement("span");
        b.textContent = c;
        b.style.cssText = "display:inline-block;text-align:center;overflow:visible;white-space:pre";
        word.appendChild(b); boxes.push([b, c]);
      });
      el.appendChild(word);
    });
    boxes.forEach(function (x) { x[0].style.width = x[0].getBoundingClientRect().width + "px"; });
    var t0 = performance.now();
    function frame(now) {
      var p = Math.min(1, (now - t0) / SCRAMBLE_MS);
      var settled = Math.floor(p * boxes.length);
      for (var i = 0; i < boxes.length; i++) boxes[i][0].textContent = i < settled ? boxes[i][1] : scrChar(boxes[i][1]);
      if (p < 1 && el.isConnected) el._scr = requestAnimationFrame(frame);
      else { el.textContent = text; el._scr = null; }
    }
    frame(t0);   // scrambled from the very first paint
    el._scr = requestAnimationFrame(frame);
  }

  // Before the first question: greeting + starter questions, sitting at the bottom.
  function start() {
    history = []; asked = []; turns = []; lastFollow = [];
    save();
    log.innerHTML = "";
    var intro = document.createElement("div");
    intro.className = "intro";
    var g = document.createElement("div");
    g.className = "greet";
    intro.appendChild(g);
    intro.appendChild(chipList(SUGGESTIONS, "starter"));
    log.appendChild(intro);
    scramble(g, GREETING);
  }

  var closeTimer, lockedScroll = false;
  function setOpen(open, fromKeyboard, via) {
    if (open && panel.hidden && via !== "restore") track("tanollm_open", { via: via || "pill" });
    var phone = !inline && window.innerWidth <= MOBILE_BREAK;
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    clearTimeout(closeTimer);
    panel.classList.remove("closing");
    if (!open && !panel.hidden && phone && !still) {
      // slide back down, then hide
      panel.classList.add("closing");
      closeTimer = setTimeout(function () { panel.classList.remove("closing"); panel.hidden = true; }, SLIDE_MS);
    } else {
      panel.hidden = !open;
    }
    // While the full-screen chat is open on a phone, the page behind it shouldn't scroll.
    if (open && phone && !lockedScroll) { document.documentElement.style.overflow = "hidden"; lockedScroll = true; }
    if (!open && lockedScroll) { document.documentElement.style.overflow = ""; lockedScroll = false; }
    launcher.hidden = open;
    launcher.setAttribute("aria-expanded", String(open));
    save();
    if (open) {
      if (!log.children.length) start();
      if (!touch) setTimeout(function () { input.focus(); }, 50); // phones: don't throw the keyboard up over the slide
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
    var projects = [], re = /%%PROJECT:\s*([a-z0-9-]+)\s*%%/gi, pm;
    while ((pm = re.exec(raw))) {
      var id = pm[1].toLowerCase();
      if (PROJECTS[id] && projects.indexOf(id) < 0) projects.push(id);
    }
    return { text: text, follow: follow, projects: projects.slice(0, 2) };
  }

  async function ask(text, source) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    // Typed questions are never sent to Analytics (visitors might type personal info); only which kind it was.
    var ev = { source: source || "typed", placement: inline ? "page" : "overlay" };
    if (source) ev.question = text.slice(0, 100);
    track("tanollm_question", ev);
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

    // Secret code word: answer locally (no AI call, no cost) with a chess challenge.
    if (CHESS_CODE_WORDS.indexOf(text.toLowerCase().replace(/[^a-z0-9.]/g, "")) >= 0 && PROJECTS.chess) {
      out.classList.remove("typing");
      scramble(out, CHESS_SECRET_REPLY);
      turn.appendChild(cardList(["chess"]));
      turns.push({ q: text, a: CHESS_SECRET_REPLY, projects: ["chess"] });
      lastFollow = [];
      track("tanollm_chess_code", {});
      save();
      busy = false;
      if (!touch) input.focus();
      return;
    }

    asked.push(text);
    history.push({ role: "user", content: text });
    var raw = "", parsed = { text: "", follow: [], projects: [] };
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
    out.innerHTML = linkify(parsed.text);
    out.classList.remove("typing");
    if (parsed.projects.length) turn.appendChild(cardList(parsed.projects));
    if (parsed.text) {
      history.push({ role: "assistant", content: parsed.text });
      turns.push({ q: text, a: parsed.text, projects: parsed.projects });
    } else history.pop();

    // Follow-up questions under the answer (falls back to unused starters).
    var notAsked = function (s2) { return asked.indexOf(s2) < 0; };
    var follow = parsed.follow.filter(notAsked);
    if (!follow.length) follow = SUGGESTIONS.filter(notAsked).slice(0, 3);
    if (follow.length) {
      var f = document.createElement("div");
      f.className = "follow";
      f.appendChild(chipList(follow, "followup"));
      turn.appendChild(f);
    }
    lastFollow = follow;
    save();
    busy = false;
    if (!touch) input.focus(); // on phones, don't pop the keyboard up after every answer
  }

  // Make emails and web addresses in answers clickable (text is escaped first, so nothing else becomes HTML).
  function linkify(text) {
    return esc(text).replace(/([\w.+-]+@[\w-]+\.[\w.]+)|((?:https?:\/\/)?(?:www\.)?(?:tanodsgn\.com|linkedin\.com|degaetano-resume\.cargo\.site|newart\.city)(?:\/[^\s<]*)?)/g,
      function (m, email, url) {
        var trail = "";
        if (url) { var t = url.match(/[.,;:!?)]+$/); if (t) { trail = t[0]; url = url.slice(0, -trail.length); } }
        if (email) return '<a href="mailto:' + email + '">' + email + "</a>";
        var href = /^https?:/.test(url) ? url : "https://" + url;
        return '<a href="' + href + '" target="_blank" rel="noopener">' + url + "</a>" + trail;
      });
  }

  function cardList(ids) {
    var wrap = document.createElement("div");
    wrap.className = "cards";
    ids.forEach(function (id) {
      var pr = PROJECTS[id];
      var a = document.createElement("a");
      a.className = "card"; a.href = pr.url;
      var img = document.createElement("img");
      img.src = /^https?:/.test(pr.thumb) ? pr.thumb : BASE + "/" + pr.thumb;
      img.alt = ""; img.loading = "lazy";
      var ct = document.createElement("span"); ct.className = "ct";
      var cn = document.createElement("span"); cn.className = "cn"; cn.textContent = pr.title;
      var cv = document.createElement("span"); cv.className = "cv"; cv.textContent = pr.cta || "View project \u2197";
      ct.appendChild(cn); ct.appendChild(cv);
      a.appendChild(img); a.appendChild(ct);
      a.onclick = function (e) {
        e.preventDefault();
        track("tanollm_project_click", { project: id });
        save();
        // On phones the chat covers the screen, so close it to reveal the project page.
        if (!inline && window.innerWidth <= MOBILE_BREAK) setOpen(false);
        navigate(pr.url);
      };
      wrap.appendChild(a);
    });
    return wrap;
  }

  // Click a hidden normal link in the page so Cargo switches pages its own way (no reload).
  // If the site doesn't handle it, the browser loads the page normally and the chat is restored from memory.
  function navigate(url) {
    // Same site with or without www: use the address the visitor is on, so it counts as an in-site link.
    try {
      var u = new URL(url, location.href);
      if (u.hostname.replace(/^www\./, "") === location.hostname.replace(/^www\./, "")) url = location.origin + u.pathname + u.search + u.hash;
    } catch (e) {}
    var link = document.createElement("a");
    link.href = url; link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(function () { link.remove(); }, 0);
  }

  // Remember the conversation for this browser tab only (cleared when the tab closes).
  function save() {
    try {
      sessionStorage.setItem("tanollm", JSON.stringify({
        history: history, turns: turns, asked: asked, follow: lastFollow,
        open: !panel.hidden && !inline,
      }));
    } catch (e) {}
  }
  function restore() {
    var data;
    try { data = JSON.parse(sessionStorage.getItem("tanollm") || "null"); } catch (e) {}
    if (!data || !data.turns || !data.turns.length) return false;
    history = data.history || []; turns = data.turns; asked = data.asked || []; lastFollow = data.follow || [];
    log.innerHTML = "";
    turns.forEach(function (t, i) {
      var turn = document.createElement("div");
      turn.className = "turn";
      var q = document.createElement("div"); q.className = "q"; q.textContent = t.q;
      var a = document.createElement("div"); a.className = "a"; a.innerHTML = linkify(t.a);
      turn.appendChild(q); turn.appendChild(a);
      var ids = (t.projects || []).filter(function (id) { return PROJECTS[id]; });
      if (ids.length) turn.appendChild(cardList(ids));
      if (i === turns.length - 1 && lastFollow.length) {
        var f = document.createElement("div"); f.className = "follow";
        f.appendChild(chipList(lastFollow, "followup"));
        turn.appendChild(f);
      }
      log.appendChild(turn);
    });
    return data.open;
  }

  function resize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
    input.style.overflowY = input.scrollHeight > 120 ? "auto" : "hidden"; // only scroll for very long messages
  }

  launcher.onclick = function () { setOpen(true); };
  $(".x").onclick = function () { setOpen(false); };
  $(".reset").onclick = function () { if (!busy) { track("tanollm_reset", {}); start(); input.focus(); } };
  input.addEventListener("input", function () { resize(); send.disabled = !input.value.trim() || busy; });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); }
  });
  root.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false, true); });
  form.onsubmit = function (e) { e.preventDefault(); ask(input.value); };

  // Google Analytics: uses the site's gtag (or Tag Manager's dataLayer) if there is one. Never breaks the chat.
  function track(name, params) {
    try {
      if (typeof window.gtag === "function") window.gtag("event", name, params);
      else if (Array.isArray(window.dataLayer)) window.dataLayer.push(Object.assign({ event: name }, params));
    } catch (e) {}
  }

  // Your own icon/button opens the chat. Any of these work, however Cargo writes the link:
  //   a link to #tanollm or /tanollm, an image with alt text "tanollm", class "tanollm-open", or data-tanollm-open.
  // Caught before Cargo sees the click, so Cargo never tries to load a "tanollm" page.
  function isTrigger(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.hasAttribute("data-tanollm-open") || (el.classList && el.classList.contains("tanollm-open"))) return true;
    try { if (ICON_SELECTOR && el.matches(ICON_SELECTOR)) return true; } catch (e) {}
    if ((el.getAttribute("alt") || "").trim().toLowerCase() === "tanollm") return true;
    // Any element with a link, including Cargo's media-item (href="tanollm")
    var href = (el.getAttribute("href") || "").trim();
    return /(^|[\/#])tanollm\/?$/i.test(href);
  }
  window.addEventListener("click", function (e) {
    var path = e.composedPath ? e.composedPath() : [];
    var hit = false;
    for (var i = 0; i < path.length && path[i] !== document; i++) {
      if (path[i] === host) return; // clicks inside the chat itself
      if (isTrigger(path[i])) { hit = true; break; }
    }
    if (!hit) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (inline) { host.scrollIntoView({ behavior: "smooth", block: "start" }); track("tanollm_open", { via: "icon" }); }
    else setOpen(true, false, "icon");
  }, true);

  function triggerInPath(e) {
    var path = e.composedPath ? e.composedPath() : [];
    for (var i = 0; i < path.length && path[i] !== document; i++) {
      if (path[i] === host) return false;
      if (isTrigger(path[i])) return true;
    }
    return false;
  }
  // Cargo may act on the press itself (before the click), so hide those from Cargo too.
  ["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend"].forEach(function (type) {
    window.addEventListener(type, function (e) { if (triggerInPath(e)) e.stopImmediatePropagation(); }, true);
  });

  // Last line of defence: if Cargo still tries to switch to a "tanollm" page, open the chat instead.
  var TANOLLM_URL = /(^|[\/#])tanollm\/?$/i;
  ["pushState", "replaceState"].forEach(function (fn) {
    var orig = history[fn];
    history[fn] = function (state, title, url) {
      if (url != null && TANOLLM_URL.test(String(url).split("?")[0])) { if (!inline) setOpen(true, false, "icon"); return; }
      return orig.apply(this, arguments);
    };
  });
  // And if the browser ever lands on /tanollm directly, go back to where the visitor was and open the chat.
  if (TANOLLM_URL.test(location.pathname)) {
    try { sessionStorage.setItem("tanollm-open", "1"); } catch (e) {}
    var back = document.referrer && document.referrer.indexOf(location.origin) === 0 && !TANOLLM_URL.test(new URL(document.referrer).pathname)
      ? document.referrer : location.origin + "/";
    location.replace(back);
  }

  // Embedded mode: if the page has <div data-tanollm>, the chat lives inside it, always open.
  // Cargo swaps pages without reloading, so keep checking as pages change.
  var inline = false;
  function placeWidget() {
    var mount = document.querySelector("[data-tanollm], #tanollm");
    if (mount) {
      if (host.parentNode !== mount) {
        mount.appendChild(host);
        wrapEl.style.setProperty("--inline-h", mount.getAttribute("data-height") || "75vh");
      }
      if (!inline) {
        inline = true; wrapEl.classList.add("inline");
        panel.hidden = false; launcher.hidden = true;
        if (!log.children.length) start();
      }
    } else {
      if (host.parentNode !== document.body) document.body.appendChild(host);
      if (inline) { inline = false; wrapEl.classList.remove("inline"); setOpen(false); }
    }
  }
  var placeQueued = false;
  new MutationObserver(function () {
    if (placeQueued) return;
    placeQueued = true;
    requestAnimationFrame(function () { placeQueued = false; placeWidget(); });
  }).observe(document.body, { childList: true, subtree: true });

  // Follow the site's light/dark toggle (html data-theme="light"), unless data-theme is set on the script tag.
  var wrapEl = $(".wrap");
  function syncTheme() {
    var light = d.theme ? d.theme === "light" : document.documentElement.getAttribute("data-theme") === "light";
    wrapEl.classList.toggle("light", light);
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  var reopen = restore();
  try { if (!TANOLLM_URL.test(location.pathname) && sessionStorage.getItem("tanollm-open")) { sessionStorage.removeItem("tanollm-open"); reopen = true; } } catch (e) {}
  placeWidget();
  if (!inline && (reopen || d.open === "true")) {
    setOpen(true, false, "restore");
    log.scrollTop = log.scrollHeight;
  }
})();
