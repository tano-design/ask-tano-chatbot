# TanoLLM

An AI assistant that knows my work, built into my portfolio site.

**Try it:** [tanodsgn.com](https://tanodsgn.com). Click the TanoLLM button in the corner, or the icon on mobile.

Instead of making a recruiter dig through pages, they can just ask: what kind of roles am I looking for, what did I actually do on a project, how do I work. TanoLLM answers in a relaxed, direct voice that matches mine. When a project comes up, it shows a thumbnail card that links straight to the case study.

## How it works

```
Visitor on tanodsgn.com
   │  asks a question in the widget
   ▼
Vercel serverless function  (/api/chat)
   │  checks the request comes from my site, rate-limits it, keeps the API key private
   ▼
Claude API  ──  answers from a written brief about me and my work
   │
   ▼
Answer streams back into the widget, with suggested follow-up questions and project cards
```

- **The widget** (`public/widget.js`) is a single script tag pasted into my Cargo site. It renders inside a Shadow DOM, so the site's styles and the widget's styles never collide.
- **Designed to match the site.** Same type, same colors and the same glitch hover effects as the rest of tanodsgn.com. It follows the site's light/dark toggle.
- **On desktop** it opens as a full-height panel over the site's left column. **On phones** it slides up full screen from an icon, or sits inline on the About page.
- **Project cards.** The model can tag a project, and the widget turns the tag into a thumbnail link. Clicking it navigates within the site without reloading, and the conversation is kept.
- **Follow-up questions** are generated with each answer, so visitors always have somewhere to go next.
- **Cost and abuse controls.** A small, fast model with prompt caching, short answers, a per-visitor hourly limit, a message length cap, and requests accepted only from my domain.
- **Analytics.** Opens, questions and project clicks are sent to Google Analytics, so I can see what people actually ask.

## What's inside

| Path | What it is |
|---|---|
| `ask-tano-chatbot/public/widget.js` | The chat widget: look, behavior, project cards, mobile mode |
| `ask-tano-chatbot/api/chat.js` | The backend that talks to Claude |
| `ask-tano-chatbot/lib/system-prompt.js` | What the assistant knows about me, and how it talks |
| `ask-tano-chatbot/public/thumbs/` | Project thumbnails |
| `ask-tano-chatbot/README.md` | Setup walkthrough (Vercel, environment variables, Cargo embed) |

The API key lives only in Vercel's environment variables. Nothing secret is in this repo.

## Also on the site

[TANOMATE](https://tanodsgn.com/chess), a chess bot trained on my own games. TanoLLM knows the code words that open it.

Made by [Chris DeGaetano](https://tanodsgn.com), graphic and brand designer. Built with Claude.
