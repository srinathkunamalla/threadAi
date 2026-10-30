# Threadcraft AI — LinkedIn Comment Studio

A responsive, human-reviewed LinkedIn comment drafting application built with **React + TypeScript + Vite** and **Node.js + Express**. It generates three distinct drafts using OpenAI's Responses API, lets you edit and save drafts locally, and copies your chosen comment for manual posting on LinkedIn.

> **Important:** This is a drafting tool, not a LinkedIn bot. It does not scrape LinkedIn, sign into your LinkedIn account, automatically like posts, or automatically publish comments.

## Instant browser demo

Open **`demo.html`** in a browser to try a standalone interactive preview with no installations or API key. It runs illustrative, rule-based demo templates (not real AI inference). The full React application below supports live OpenAI generation.

## Quick start

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:5173** in your browser. The app works immediately in **demo mode**, with clearly identified illustrative sample drafts. The demo drafts are rule-based examples, not AI-generated text.

### Enable real AI generation

1. Get an OpenAI API key from https://platform.openai.com/api-keys (API usage is billed separately from a ChatGPT subscription).
2. Put it in the `.env` file at the **project root**:

   ```ini
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-5-mini
   PORT=8787
   ```

3. Restart `npm run dev`. The status pill will show **AI connected**. The model can be changed to any Responses API-compatible model supported by your API project.

**Never put an API key in `src/` or a variable starting with `VITE_`.** Keys stay on the Express server.

## Features

- Paste a LinkedIn post or load an example
- Choose a technical, engineering leadership, or conversational perspective
- Choose short, balanced, or detailed output
- Optionally describe your *real* experience so the AI can ground first-person claims
- Three distinct comment drafts with a brief explanation for each
- Edit drafts in place; copy or save any draft
- Saved drafts in browser localStorage, with editing, deletion, and copy
- Clear demo vs. live AI status
- Backend schema validation, request size limit, and per-IP generation rate limit
- Responsive mobile and desktop layout
- No LinkedIn credentials or automated LinkedIn interactions

## Scripts

```bash
npm run dev      # Vite frontend at :5173 + Express API at :8787
npm run build    # TypeScript check + optimized frontend build
npm start        # serve built frontend + API at http://localhost:8787
npm test         # basic API generation/validation tests
```

### API example

```bash
curl http://localhost:8787/api/health

curl http://localhost:8787/api/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "postText": "AI agents need reliable orchestration, sensible permission boundaries, and durable retries that do not repeat expensive actions.",
    "perspective": "technical",
    "length": "balanced",
    "context": "I have worked on payment processing and idempotent retry design."
  }'
```

### Production considerations

This is a **single-user MVP for local use**. Before hosting it publicly:

- Add authentication and per-user quotas. Otherwise anyone who can reach the endpoint can generate billable OpenAI requests using your key.
- Restrict origin/network access and use HTTPS.
- Add metrics, logging, budget limits, and an appropriate retention policy.
- Do not deploy a public version with only the default per-IP rate limiter.
- Saved drafts are local to the browser; if you need cloud synchronization, add authentication and a database.
- LinkedIn posting is intentionally **manual**. Any future publishing feature would require official LinkedIn API authorization and review of current platform policies.

## Privacy and safety

The server submits the pasted post and any user-supplied context to the configured OpenAI API for live generation. The API request uses `store: false`. No database is configured. Drafts saved in the interface live only in browser localStorage. User content is not deliberately written to server logs.

The system prompt treats pasted posts as untrusted source text, discourages invented credentials and first-person experience, and asks for substantive non-spammy comments. You remain responsible for checking accuracy, appropriateness, and permission to publish.

## Directory structure

```
server/
  index.ts          Express HTTP API and static-file serving
  generator.ts      Zod validation, demo drafts, OpenAI Responses API
  generator.test.ts Basic validation tests
src/
  App.tsx           Responsive interactive React UI
  main.tsx          App entry point
  styles.css        Styles and responsive layouts
  types.ts          Shared frontend types
```

Docs:
- OpenAI quickstart: https://developers.openai.com/api/docs/quickstart
- LinkedIn Comments API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/comments-api
