# Widget POC — Embeddable AI Radiology Assistant

A proof-of-concept demonstrating an embeddable AI widget that observes a host
application's DOM elements and provides context-aware suggestions in real-time.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Host App (port 3000)          │  Widget iframe (port 3001)  │
│  Simulates a PACS report       │  AI assistant panel         │
│  editor with text fields,      │  receives live context      │
│  buttons, dropdowns            │  via postMessage and        │
│                                │  calls backend for AI       │
│  SDK observes DOM elements     │  suggestions                │
│  and streams changes ──────────>│                             │
│  <──────── insert actions ─────│                             │
└──────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                          Backend (port 4000)
                          Express API with mock
                          AI suggestion engine
```

## Quick start

```bash
# Install all dependencies
npm run install-all

# Start all 3 services (in separate terminals, or use the start script)
npm start
```

Or start each service individually:

```bash
# Terminal 1 — Backend
cd backend && npm start

# Terminal 2 — Host app (PACS simulator)
cd host-app && npm start

# Terminal 3 — Widget app (iframe content)
cd widget-app && npm start
```

## How to use

1. Open http://localhost:3000 in your browser
2. The widget panel appears on the right side (served from port 3001 as an iframe)
3. Type in the **Findings** text box — try phrases like:
   - "There is a 2cm nodule in the right upper lobe"
   - "Right lower lobe consolidation consistent with pneumonia"
   - "Non-displaced fracture of the distal radius"
   - "Moderate right-sided pleural effusion"
4. Watch the widget receive your text in real-time and generate AI suggestions
5. Click **Insert** on a suggestion to push text back into the host editor
6. Click different studies in the left sidebar to change the patient context
7. Switch to the **Context** tab in the widget to see the raw postMessage data

## What this demonstrates

- **Loader SDK** (`host-app/src/widgetSDK.js`): The script a 3rd party adds to
  their page. Watches DOM elements via `watchText()`, `watchClick()`,
  `watchSelect()` and forwards events to the widget iframe via `postMessage`.

- **postMessage bridge** (`widget-app/src/services/hostBridge.js`): The widget's
  communication layer. Validates origins, routes messages, debounces AI calls.

- **Context-aware AI** (`backend/src/server.js`): Mock AI engine that analyzes
  the current report text + study context and returns relevant suggestions.

- **Bidirectional flow**: Host → Widget (context) and Widget → Host (insert actions).

## File structure

```
widget-poc/
├── backend/                 # Express API server
│   ├── package.json
│   └── src/
│       └── server.js        # AI suggestion endpoint + mock engine
├── host-app/                # React app simulating PACS/RIS
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js           # Report editor UI
│       ├── index.js
│       └── widgetSDK.js     # The loader SDK (would be on CDN in prod)
├── widget-app/              # React app running inside iframe
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js           # Widget shell with tabs
│       ├── index.js
│       ├── components/
│       │   ├── ContextPanel.js    # Shows live host element data
│       │   └── SuggestionCard.js  # AI suggestion display
│       └── services/
│           └── hostBridge.js      # postMessage handler
├── package.json
├── start.sh                 # Start all 3 services
└── README.md
```

## Ports

| Service    | Port | Description                    |
|------------|------|--------------------------------|
| Host app   | 3000 | The "3rd party" PACS simulator |
| Widget app | 3001 | Your widget iframe content     |
| Backend    | 4000 | Your AI suggestion API         |

## Production considerations

In a real deployment, you would:
- Serve `loader.js` from your CDN (not bundled in the host app)
- Use `Content-Security-Policy: frame-ancestors` for origin validation
- Implement real JWT auth via the token passthrough flow
- Replace the mock AI with actual model calls
- Add org-scoped API keys and rate limiting
- Scope all data access by `org_id` through your middleware pipeline
