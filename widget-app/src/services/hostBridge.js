/**
 * HostBridge — communication layer between widget iframe and host page
 */

const HOST_ORIGIN = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:4000';

let onTextChangedCallback = null;
let onClickedCallback = null;
let onSelectionChangedCallback = null;
let onContextCallback = null;

// AI analysis debounce
let analysisTimer = null;
let latestElementStates = {};
let studyContext = {};
let onSuggestionsCallback = null;

export function init({ onTextChanged, onClicked, onSelectionChanged, onContext, onSuggestions }) {
  onTextChangedCallback = onTextChanged;
  onClickedCallback = onClicked;
  onSelectionChangedCallback = onSelectionChanged;
  onContextCallback = onContext;
  onSuggestionsCallback = onSuggestions;

  window.addEventListener('message', handleMessage);

  // Tell host we're ready
  window.parent.postMessage({ type: 'widget:ready', version: '1.0' }, '*');
}

function handleMessage(e) {
  // In production: validate against registered origins
  // For POC we accept the known host
  if (e.origin !== HOST_ORIGIN) return;

  const msg = e.data;

  switch (msg.type) {
    case 'element:text-changed':
      latestElementStates[msg.payload.label] = msg.payload.value;
      if (onTextChangedCallback) onTextChangedCallback(msg.payload);
      scheduleAnalysis();
      break;

    case 'element:clicked':
      if (onClickedCallback) onClickedCallback(msg.payload);
      break;

    case 'element:selection-changed':
      latestElementStates[msg.payload.label] = msg.payload.selectedText || msg.payload.value;
      if (onSelectionChangedCallback) onSelectionChangedCallback(msg.payload);
      scheduleAnalysis();
      break;

    case 'context:update':
      studyContext = msg.payload;
      if (onContextCallback) onContextCallback(msg.payload);
      break;

    case 'auth:token':
      // In production: store and use for API calls
      console.log('[Widget] Received auth token');
      break;

    default:
      break;
  }
}

function scheduleAnalysis() {
  if (analysisTimer) clearTimeout(analysisTimer);

  analysisTimer = setTimeout(async () => {
    // Only analyze if we have meaningful content
    const hasContent = Object.values(latestElementStates).some(v => v && v.length > 5);
    if (!hasContent) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/widget/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elements: latestElementStates,
          studyContext
        })
      });
      const data = await res.json();
      if (onSuggestionsCallback && data.suggestions) {
        onSuggestionsCallback(data.suggestions);
      }
    } catch (err) {
      console.error('[Widget] Analysis failed:', err);
    }
  }, 800);
}

// Send action back to host
export function insertText(targetElementId, text, mode = 'replace') {
  window.parent.postMessage({
    type: 'action:insert',
    payload: { targetElementId, text, mode }
  }, HOST_ORIGIN);
}

export function destroy() {
  window.removeEventListener('message', handleMessage);
  if (analysisTimer) clearTimeout(analysisTimer);
}
