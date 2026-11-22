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
  var EDGE = "1.5rem";                // padding, matches Cargo's 1.5
  var COLUMN_WIDTH = "22.33vw";       // overlay width, matches your index column (max-width: 22.33%)
  var MOBILE_BREAK = 768;             // below this screen width, the overlay goes full width
  var RADIUS = "0";                   // corner rounding of pill, input and buttons: "0" = rectangular
  var BRAND_FONT = '"Monument Grotesk", "Monument Grotesk Variable", "ABC Monument Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif';

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
      --bg: #191919; --fg: #f2f1ed; --mute: #8a8a85; --line: #2e2e2c; --field: #222221;
      font: 15px/1.45 ${BRAND_FONT};
      color: var(--fg); -webkit-font-smoothing: antialiased;
    }
    .wrap.light { --bg: #f4f4f2; --fg: #2b2f36; --mute: #8b8d91; --line: #e2e2df; --field: #ebebe8; }

    button { all: unset; cursor: pointer; }
    button:focus-visible { outline: 1px solid var(--fg); outline-offset: 2px; }

    /* Launcher pill */
    .launcher {
      position: fixed; bottom: ${EDGE}; ${SIDE}: ${EDGE}; z-index: 2147483000;
      display: inline-flex; align-items: center; gap: 10px;
      background: var(--bg); color: var(--fg); border: 1px solid var(--line);
      padding: 11px 16px 11px 14px; border-radius: ${RADIUS};
      font: 500 13px/1 ${BRAND_FONT}; letter-spacing: .02em; word-spacing: .12em; text-transform: uppercase;
      box-shadow: 0 6px 24px rgba(0,0,0,.18); transition: transform .2s ease;
    }
    .launcher:hover { transform: translateY(-2px); }
    .launcher[hidden] { display: none; }
    /* Trim the font's built-in space above/below the letters so text centers optically */
    .trim { display: block; line-height: 1; text-box: trim-both cap alphabetic; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: ${DOT_COLOR}; flex: none; }
    .launcher .dot { animation: pulse 2.4s infinite; }
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
    .title { display: flex; align-items: center; gap: 9px; font-size: 15px; letter-spacing: .01em; }
    .tools { display: flex; gap: 14px; color: var(--mute); }
    .tools button { width: 20px; height: 20px; display: grid; place-items: center; }
    .tools button:hover { color: var(--fg); }

    /* Conversation: anchored to the bottom, scrolls when long */
    .log { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 18px;
           padding: 24px 0 18px; scrollbar-width: none; }
    .log::-webkit-scrollbar { display: none; }
    .log > :first-child { margin-top: auto; }
    .greet { font-size: 22px; line-height: 1.25; letter-spacing: -.01em; }
    .msg { white-space: pre-wrap; word-wrap: break-word; }
    .me { color: var(--mute); }
    .me::before { content: "\\21B3\\00a0"; }
    .typing::after { content: "\\258D"; animation: blink 1s steps(1) infinite; color: var(--mute); }
    @keyframes blink { 50% { opacity: 0 } }

    .chips { display: flex; flex-direction: column; gap: 12px; }
    .chip { color: var(--mute); display: flex; align-items: baseline; gap: 8px; line-height: 1.35; }
    .chip::before { content: "\\21B3"; flex: none; }
    .chip:hover { color: var(--fg); }

    /* Input */
    form { flex: none; display: flex; align-items: center; gap: 8px;
           background: var(--field); border-radius: ${RADIUS}; padding: 4px 6px 4px 14px; }
    textarea { flex: 1; resize: none; border: 0; background: transparent; color: var(--fg);
               font: inherit; line-height: 1.3; max-height: 120px; padding: 10px 0; outline: none; display: block; }
    textarea::placeholder { color: var(--mute); }
    .send { width: 32px; height: 32px; display: grid; place-items: center; color: var(--fg);
            border-radius: ${RADIUS}; flex: none; }
    .send:hover:not(:disabled) { background: var(--line); }
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

  function addMsg(role, text) {
    var el = document.createElement("div");
    el.className = "msg " + (role === "user" ? "me" : "bot");
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function start() {
    history = [];
    log.innerHTML = "";
    var g = document.createElement("div");
    g.className = "greet";
    g.textContent = GREETING;
    log.appendChild(g);
    var chips = document.createElement("div");
    chips.className = "chips";
    SUGGESTIONS.forEach(function (q) {
      var b = document.createElement("button");
      b.className = "chip"; b.type = "button"; b.textContent = q;
      b.onclick = function () { ask(q); };
      chips.appendChild(b);
    });
    log.appendChild(chips);
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

  async function ask(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    var chips = log.querySelector(".chips");
    if (chips) chips.remove();
    input.value = ""; resize(); send.disabled = true;
    addMsg("user", text);
    history.push({ role: "user", content: text });

    var out = addMsg("assistant", "");
    out.classList.add("typing");
    var answer = "";
    try {
      var res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        answer = (await res.text()) || "Something went wrong. Try again in a moment.";
        out.textContent = answer;
      } else {
        var reader = res.body.getReader(), dec = new TextDecoder();
        while (true) {
          var r = await reader.read();
          if (r.done) break;
          answer += dec.decode(r.value, { stream: true });
          out.textContent = answer;
          log.scrollTop = log.scrollHeight;
        }
      }
    } catch (e) {
      answer = "Couldn't reach " + NAME + ". Check your connection and try again.";
      out.textContent = answer;
    }
    out.classList.remove("typing");
    if (answer) history.push({ role: "assistant", content: answer });
    else history.pop();
    busy = false;
    input.focus();
  }

  function resize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
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

  if (d.open === "true") setOpen(true);
})();
