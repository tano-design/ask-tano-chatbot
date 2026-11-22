/*  Ask-about-tano chat widget
 *  Paste ONE line into Cargo (Site Settings → CSS / HTML → HTML):
 *    <script src="https://YOUR-PROJECT.vercel.app/widget.js" defer></script>
 *
 *  Optional settings, as attributes on that same script tag:
 *    data-label="Ask about tano"     text on the launcher button
 *    data-title="tano, explained"     heading inside the panel
 *    data-theme="dark" | "light"      default: dark
 *    data-position="right" | "left"   default: right
 *    data-open="true"                 start opened (handy for a dedicated page)
 */
(function () {
  if (window.__askTanoLoaded) return; // Cargo can re-run scripts between pages
  window.__askTanoLoaded = true;

  var script = document.currentScript;
  var d = (script && script.dataset) || {};
  var API = (d.api || new URL(script.src).origin) + "/api/chat";
  var LABEL = d.label || "Ask about tano";
  var TITLE = d.title || "Ask about tano";
  var THEME = d.theme === "light" ? "light" : "dark";
  var SIDE = d.position === "left" ? "left" : "right";

  // ── Edit these starter questions ──
  var SUGGESTIONS = [
    "What kind of designer is tano?",
    "Tell me about Espial Industries",
    "What tools does tano use?",
    "How do I get in touch?",
  ];
  var GREETING =
    "Hi. I'm a small assistant that knows about tano's work, process and background. What do you want to know?";

  var css = `
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .wrap {
      --bg: #191919; --fg: #f2f1ed; --mute: #8a8a85; --line: #333331; --chip: #232322;
      --accent: #f2f1ed; --accent-fg: #191919;
      font: 14px/1.45 "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: var(--fg); -webkit-font-smoothing: antialiased;
      position: fixed; bottom: 20px; ${SIDE}: 20px; z-index: 2147483000;
      display: flex; flex-direction: column; align-items: ${SIDE === "right" ? "flex-end" : "flex-start"}; gap: 10px;
    }
    .wrap.light {
      --bg: #f6f5f1; --fg: #191919; --mute: #77756f; --line: #dddbd4; --chip: #ecebe6;
      --accent: #191919; --accent-fg: #f6f5f1;
    }
    .mono { font-family: "SFMono-Regular", Menlo, Consolas, monospace; font-size: 11px;
            letter-spacing: .08em; text-transform: uppercase; }

    .launcher {
      all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 10px;
      background: var(--bg); color: var(--fg); border: 1px solid var(--line);
      padding: 11px 16px 11px 14px; border-radius: 999px;
      box-shadow: 0 6px 24px rgba(0,0,0,.18); transition: transform .2s ease;
    }
    .launcher.mono { font: 11px/1 "SFMono-Regular", Menlo, Consolas, monospace; letter-spacing: .08em; text-transform: uppercase; }
    .launcher[hidden] { display: none; }
    .launcher:hover { transform: translateY(-2px); }
    .launcher:focus-visible, button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #3ddc84; animation: pulse 2.4s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }

    .panel {
      width: 370px; height: min(560px, calc(100vh - 100px));
      background: var(--bg); border: 1px solid var(--line); border-radius: 14px;
      box-shadow: 0 18px 60px rgba(0,0,0,.28);
      display: flex; flex-direction: column; overflow: hidden;
      transform-origin: bottom ${SIDE}; animation: rise .22s ease;
    }
    .panel[hidden] { display: none; }
    @keyframes rise { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: none } }

    header { display: flex; align-items: center; justify-content: space-between;
             padding: 14px 16px; border-bottom: 1px solid var(--line); }
    header .t { display: flex; align-items: center; gap: 9px; color: var(--fg); }
    .x { all: unset; cursor: pointer; color: var(--mute); width: 24px; height: 24px;
         display: grid; place-items: center; border-radius: 6px; font-size: 18px; line-height: 1; }
    .x:hover { color: var(--fg); background: var(--chip); }

    .log { flex: 1; overflow-y: auto; padding: 18px 16px 8px; display: flex; flex-direction: column; gap: 14px;
           scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
    .msg { max-width: 88%; white-space: pre-wrap; word-wrap: break-word; }
    .msg .who { display: block; color: var(--mute); margin-bottom: 4px; }
    .bot { align-self: flex-start; }
    .me { align-self: flex-end; background: var(--chip); padding: 9px 12px; border-radius: 12px 12px 3px 12px; }
    .me .who { display: none; }
    .typing::after { content: "\\258D"; animation: blink 1s steps(1) infinite; color: var(--mute); }
    @keyframes blink { 50% { opacity: 0 } }

    .chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 12px; }
    .chip { all: unset; cursor: pointer; font-size: 12.5px; color: var(--fg); background: transparent;
            border: 1px solid var(--line); border-radius: 999px; padding: 6px 11px; }
    .chip:hover { background: var(--chip); }

    form:focus-within { background: var(--chip); }
    form { display: flex; align-items: flex-end; gap: 8px; padding: 12px; border-top: 1px solid var(--line); }
    textarea { flex: 1; resize: none; border: 0; background: transparent; color: var(--fg);
               font: inherit; max-height: 110px; padding: 8px 4px; outline: none; }
    textarea::placeholder { color: var(--mute); }
    .send { all: unset; cursor: pointer; width: 34px; height: 34px; border-radius: 50%;
            background: var(--accent); color: var(--accent-fg); display: grid; place-items: center; flex: none; }
    .send:disabled { opacity: .35; cursor: default; }
    .foot { text-align: center; color: var(--mute); padding: 0 0 10px; font-size: 10px; }

    @media (max-width: 480px) {
      .wrap { bottom: 12px; ${SIDE}: 12px; }
      .panel { width: calc(100vw - 24px); height: calc(100dvh - 90px); }
    }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
  `;

  var host = document.createElement("div");
  host.id = "ask-tano";
  var root = host.attachShadow({ mode: "open" });
  root.innerHTML =
    "<style>" + css + "</style>" +
    '<div class="wrap ' + THEME + '">' +
    '  <section class="panel" role="dialog" aria-label="' + esc(TITLE) + '" hidden>' +
    '    <header><span class="t mono"><span class="dot"></span>' + esc(TITLE) + "</span>" +
    '      <button class="x" aria-label="Close chat">&times;</button></header>' +
    '    <div class="log" aria-live="polite"></div>' +
    '    <div class="chips"></div>' +
    "    <form>" +
    '      <textarea rows="1" maxlength="600" placeholder="Ask a question&hellip;" aria-label="Your message"></textarea>' +
    '      <button class="send" type="submit" aria-label="Send" disabled>' +
    '        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12V2M2.5 6.5 7 2l4.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    "      </button>" +
    "    </form>" +
    '    <div class="foot mono">AI assistant &middot; can make mistakes</div>' +
    "  </section>" +
    '  <button class="launcher mono" aria-expanded="false"><span class="dot"></span>' + esc(LABEL) + "</button>" +
    "</div>";
  document.body.appendChild(host);

  var $ = function (s) { return root.querySelector(s); };
  var panel = $(".panel"), launcher = $(".launcher"), log = $(".log"), chips = $(".chips");
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
    el.innerHTML = '<span class="who mono">' + (role === "user" ? "You" : "tano.bot") + "</span>";
    var body = document.createElement("span");
    body.textContent = text;
    el.appendChild(body);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return body;
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.hidden = open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) {
      if (!log.children.length) {
        addMsg("assistant", GREETING);
        SUGGESTIONS.forEach(function (q) {
          var b = document.createElement("button");
          b.className = "chip"; b.type = "button"; b.textContent = q;
          b.onclick = function () { ask(q); };
          chips.appendChild(b);
        });
      }
      setTimeout(function () { input.focus(); }, 50);
    } else {
      launcher.focus();
    }
  }

  async function ask(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    chips.innerHTML = "";
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
      answer = "Couldn't reach the assistant. Check your connection and try again.";
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
    input.style.height = Math.min(input.scrollHeight, 110) + "px";
  }

  launcher.onclick = function () { setOpen(true); };
  $(".x").onclick = function () { setOpen(false); };
  input.addEventListener("input", function () { resize(); send.disabled = !input.value.trim() || busy; });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); }
  });
  root.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  form.onsubmit = function (e) { e.preventDefault(); ask(input.value); };

  if (d.open === "true") setOpen(true);
})();
