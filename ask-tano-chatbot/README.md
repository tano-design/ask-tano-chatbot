# Ask about tano: a chatbot for tanodsgn.com

A small chat bubble for your Cargo site. Visitors ask questions, and Claude answers using only what you've written about yourself, in your voice.

**How it fits together**

```
Visitor on tanodsgn.com
   │  types a question in the widget (widget.js, loaded from Vercel)
   ▼
Your Vercel project  ──  /api/chat  (holds your secret API key, checks the visitor is on your site, limits spam)
   │
   ▼
Claude API  ──  answers using lib/system-prompt.js  ──  reply streams back into the widget
```

Your API key only ever lives on Vercel. Nothing secret goes into Cargo.

**What's in this folder**

| File | What it is | Do you edit it? |
|---|---|---|
| `lib/system-prompt.js` | Everything the bot knows about you, and your voice | **Yes, this is the main one** |
| `public/widget.js` | The chat bubble and panel (look, starter questions, greeting) | Optional |
| `api/chat.js` | The backend that talks to Claude | Rarely (limits and model at the top) |
| `public/index.html` | A test page so you can try it before touching Cargo | No |
| `package.json` | Tells Vercel which code library to install | No |

Total time: about 30 to 45 minutes, no terminal needed.

---

## Step 1. Fill in your info and voice (10 min)

Open `lib/system-prompt.js` in any text editor (TextEdit in plain-text mode, VS Code, whatever).

1. **ABOUT**: I drafted this from tanodsgn.com. Fix anything wrong and replace every `[FILL IN ...]`, especially pronouns, your two jobs, a line per project, and what roles you're after. The bot will only say things written here, so more detail means better answers.
2. **VOICE**: describe how the bot should sound. Paste the voice instructions you have in mind here.
3. **RULES**: fine as they are. They keep it on-topic and stop it inventing facts.

Two rules so it keeps working: don't type a backtick ( ` ) inside your text, and don't type `${`.

Optional, in `public/widget.js` near the top: change the four starter questions (`SUGGESTIONS`) and the greeting (`GREETING`).

## Step 2. Get a Claude API key (5 min)

1. Go to **platform.claude.com** and sign up (this is separate from a Claude.ai chat subscription).
2. Add a payment method and buy a small amount of credit. $5 to $10 goes a long way for this.
3. **Set a monthly spend limit.** Look under Settings for Limits and set something like $10/month. This is your real cost cap: if the bot ever gets hammered, it just stops answering instead of running up a bill.
4. Go to **API Keys → Create Key**. Name it `tanodsgn-chatbot`. Copy it somewhere safe for 10 minutes. It starts with `sk-ant-`. Treat it like a password: never paste it into Cargo, GitHub, or a chat.

## Step 3. Put the code on GitHub (5 min)

Vercel deploys from GitHub, and you can do this entirely in the browser.

1. Make a free account at **github.com** if you don't have one.
2. Click **+ → New repository**. Name it `ask-tano-chatbot`, set it to **Private**, and click **Create repository**.
3. On the next screen click **uploading an existing file**.
4. Drag in the *contents* of this folder: `api`, `lib`, `public`, `package.json`, `.gitignore`. (Skip `screenshots`, `README.md` and `.env.example` if you like; they're harmless either way.)
   Tip: on a Mac, files starting with a dot are hidden in Finder. Press **Cmd + Shift + .** to show them.
5. Click **Commit changes**.

Check that GitHub shows the folders `api/`, `lib/`, `public/` at the top level, not all inside another folder.

## Step 4. Deploy on Vercel (5 min)

1. Go to **vercel.com** and sign up with your GitHub account (Hobby plan, free).
2. Click **Add New… → Project** and import `ask-tano-chatbot`. Allow Vercel to see that repository if asked.
3. On the configure screen:
   - **Framework Preset**: Other
   - Leave Build and Output settings alone.
   - Open **Environment Variables** and add:
     - `ANTHROPIC_API_KEY` = your `sk-ant-...` key
     - `ALLOWED_ORIGINS` = `https://tanodsgn.com,https://www.tanodsgn.com`
4. Click **Deploy** and wait about a minute.
5. Vercel gives you an address like `https://ask-tano-chatbot.vercel.app`. Note it down.

## Step 5. Test it before touching Cargo (2 min)

Open your Vercel address in a browser. You'll see a plain test page with the chat bubble in the corner. Ask it something.

- **It answers**: you're done with the hard part.
- **"Something went wrong on my end"**: usually the API key. In Vercel go to your project → **Settings → Environment Variables**, check `ANTHROPIC_API_KEY` (no spaces, no quotes), then **Deployments → ⋯ → Redeploy**. Env var changes only apply after a redeploy. The exact error is in your project's **Logs** tab.
- **No answer at all / credit error**: check you added credit in the Claude Console.

## Step 6. Add it to Cargo (2 min)

1. In the Cargo editor open **Site Settings** and click **CSS / HTML** at the bottom.
2. Go to the **HTML** part and paste this one line, with your real Vercel address:

   ```html
   <script src="https://ask-tano-chatbot.vercel.app/widget.js" defer></script>
   ```
3. Save, publish, and open **tanodsgn.com** in a fresh tab. The "Ask about tano" bubble appears bottom-right on every page.

Notes:
- The bubble may not work inside Cargo's editor preview, because the preview runs on a different web address than tanodsgn.com and the backend only answers your real site. Always check on the published site. If you want it working in preview too, add the preview's address to `ALLOWED_ORIGINS` in Vercel (comma-separated) and redeploy.
- If Cargo's site-wide HTML doesn't run scripts for some reason, paste the same line into a single page using the page's code view instead.

Optional settings go on the same script tag:

```html
<script src="https://ask-tano-chatbot.vercel.app/widget.js"
        data-label="Ask about me" data-title="tano, explained"
        data-theme="light" data-position="left" defer></script>
```

`data-open="true"` opens the chat immediately, useful if you make a dedicated "Ask" page.

---

## Updating it later

Edit a file on GitHub (open the file, click the pencil, **Commit changes**). Vercel redeploys automatically in about a minute. You never need to touch Cargo again unless your Vercel address changes.

Most of the time you'll only edit `lib/system-prompt.js`: add new projects, update what you're looking for, tune the voice.

## Cost and safety, in plain terms

- **Model**: Claude Opus 5.5, Anthropic's current default model, set to low effort so answers are short and quick. Roughly 1 to 2 cents per visitor message.
- **Cheaper option**: add an env var `CLAUDE_MODEL` = `claude-haiku-5-5` in Vercel and redeploy. That's about 40x cheaper per message, with somewhat less polished answers. Worth trying if traffic grows.
- **Built-in limits** (top of `api/chat.js`): messages up to 600 characters, answers capped in length, only the last 12 messages of a conversation sent, and 15 messages per visitor per 10 minutes.
- **Only your site can use it**: requests from any other website are refused.
- **The real backstop** is the monthly spend limit from Step 2.
- **Safety fallback**: if Claude declines a message for safety reasons, the request automatically retries on a fallback model. You don't need to do anything about this.
- **Accuracy**: the bot is told to stick to what's in your ABOUT section and send anything else to your email. It can still get things wrong, which is why the widget says so in small print. Ask it a few tricky questions after launch.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Bubble doesn't appear on tanodsgn.com | Check the script line has your exact Vercel address and you republished Cargo. Hard refresh (Cmd + Shift + R). |
| Bubble appears but says "Not allowed." | `ALLOWED_ORIGINS` in Vercel doesn't match the address in your browser bar. Include both `https://tanodsgn.com` and `https://www.tanodsgn.com`, then redeploy. |
| "Something went wrong on my end" | API key or credit issue. See Step 5, and check Vercel → Logs. |
| Answers are wrong or vague | Add more detail to ABOUT in `lib/system-prompt.js`. |
| Wrong tone | Rewrite VOICE with concrete examples ("say X, never say Y"). |
