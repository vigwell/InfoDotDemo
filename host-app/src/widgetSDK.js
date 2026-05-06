/**
 * InfoDot Widget Loader SDK
 * Runs on the HOST page. In production, served from CDN as loader.js.
 */

const WIDGET_ORIGIN = 'http://localhost:3001';

let iframe = null;
let wrapper = null;
let titleBar = null;
let notifDot = null;
let dragOverlay = null;
let watchers = [];
let debounceTimers = {};
let actionCallback = null;
let readyCallback = null;
let eventLogCallback = null;
let isMinimized = false;
let flickerTimer = null;

function send(msg) {
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(msg, WIDGET_ORIGIN);
  }
}

function sendActivity(msg) {
  send(msg);
  // Only flicker on real user-driven events (text / selection changes)
  const activityTypes = new Set(['element:text-changed', 'element:selection-changed']);
  if (isMinimized && activityTypes.has(msg.type)) {
    startFlicker();
  }
}

function sendDebounced(elementId, msg, delay) {
  clearTimeout(debounceTimers[elementId]);
  debounceTimers[elementId] = setTimeout(() => sendActivity(msg), delay || 300);
}

function injectFlickerStyles() {
  if (document.getElementById('infodot-flicker-style')) return;
  const style = document.createElement('style');
  style.id = 'infodot-flicker-style';
  style.textContent = `
    @keyframes infodotAlert {
      0%,100% { border-color:#5c9bff; box-shadow:0 4px 24px rgba(92,155,255,0.45); }
      30%  { border-color:#f59e0b; box-shadow:0 0 28px rgba(245,158,11,0.95),0 0 8px rgba(245,158,11,0.5); }
      60%  { border-color:#ef4444; box-shadow:0 0 28px rgba(239,68,68,0.95),0 0 8px rgba(239,68,68,0.5); }
    }
    @keyframes infodotDot {
      0%,100% { opacity:1; transform:scale(1); }
      50% { opacity:0.4; transform:scale(0.7); }
    }
  `;
  document.head.appendChild(style);
}

function startFlicker() {
  if (!wrapper || !notifDot) return;
  injectFlickerStyles();
  wrapper.style.animation = 'infodotAlert 1.4s ease-in-out infinite';
  notifDot.style.display = 'block';
  clearTimeout(flickerTimer);
  flickerTimer = setTimeout(stopFlicker, 12000);
}

function stopFlicker() {
  clearTimeout(flickerTimer);
  flickerTimer = null;
  if (wrapper) wrapper.style.animation = '';
  if (notifDot) notifDot.style.display = 'none';
}

function setMinimized(min) {
  isMinimized = min;
  if (min) {
    if (iframe) iframe.style.display = 'none';
    if (titleBar) {
      titleBar.style.borderBottom = 'none';
      titleBar.style.cursor = 'pointer';
    }
    if (wrapper) {
      wrapper.style.width = '200px';
      wrapper.style.bottom = '20px';
      wrapper.style.right = '20px';
      wrapper.style.top = 'auto';
      wrapper.style.left = 'auto';
      wrapper.style.borderRadius = '24px';
    }
    if (minBtn) { minBtn.textContent = '▲'; minBtn.title = 'Restore'; }
  } else {
    stopFlicker();
    if (iframe) iframe.style.display = 'block';
    if (titleBar) {
      titleBar.style.borderBottom = '1px solid #4f8ff750';
      titleBar.style.cursor = 'move';
    }
    if (wrapper) {
      wrapper.style.width = '380px';
      wrapper.style.borderRadius = '16px';
    }
    if (minBtn) { minBtn.textContent = '▼'; minBtn.title = 'Minimize'; }
  }
}

let minBtn = null;

export function init(config = {}) {
  const { orgKey = 'demo_org', position = 'right', onReady, onEvent } = config;

  readyCallback = onReady;
  eventLogCallback = onEvent;

  injectFlickerStyles();

  wrapper = document.createElement('div');
  wrapper.id = 'infodot-widget-wrapper';
  wrapper.style.cssText =
    'position:fixed;bottom:80px;right:20px;width:380px;border-radius:16px;' +
    'box-shadow:0 8px 48px rgba(92,155,255,0.3),0 2px 16px rgba(0,0,0,0.6);z-index:999999;overflow:hidden;user-select:none;' +
    'border:2px solid #5c9bff;transition:width 0.2s,border-radius 0.2s;';

  titleBar = document.createElement('div');
  titleBar.style.cssText =
    'height:40px;background:linear-gradient(135deg,#1a2a4a 0%,#1a1d27 100%);border-bottom:1px solid #4f8ff750;' +
    'display:flex;align-items:center;padding:0 12px;cursor:move;justify-content:space-between;flex-shrink:0;position:relative;';

  const titleLeft = document.createElement('div');
  titleLeft.style.cssText = 'display:flex;align-items:center;gap:8px;';

  const titleText = document.createElement('span');
  titleText.textContent = '✦ InfoDot Assist';
  titleText.style.cssText = 'color:#5c9bff;font-size:13px;font-weight:700;font-family:system-ui;letter-spacing:0.3px;white-space:nowrap;';

  notifDot = document.createElement('span');
  notifDot.style.cssText =
    'display:none;width:8px;height:8px;border-radius:50%;background:#ef4444;' +
    'animation:infodotDot 0.8s ease-in-out infinite;flex-shrink:0;';

  titleLeft.appendChild(titleText);
  titleLeft.appendChild(notifDot);

  const btnGroup = document.createElement('div');
  btnGroup.style.cssText = 'display:flex;align-items:center;gap:4px;';

  function makeBtn(text, title) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.title = title;
    btn.style.cssText =
      'background:none;border:none;color:#8b90a0;font-size:14px;line-height:1;' +
      'cursor:pointer;padding:2px 5px;border-radius:4px;transition:color 0.15s,background 0.15s;';
    btn.onmouseenter = () => { btn.style.background = '#2a2e3f'; btn.style.color = '#e1e4ed'; };
    btn.onmouseleave = () => { btn.style.background = 'none'; btn.style.color = '#8b90a0'; };
    return btn;
  }

  minBtn = makeBtn('▼', 'Minimize');
  const closeBtn = makeBtn('×', 'Close');
  closeBtn.style.fontSize = '18px';
  closeBtn.onmouseenter = () => { closeBtn.style.background = '#ef444430'; closeBtn.style.color = '#ef4444'; };
  closeBtn.onmouseleave = () => { closeBtn.style.background = 'none'; closeBtn.style.color = '#8b90a0'; };
  closeBtn.onclick = () => { wrapper.style.display = 'none'; stopFlicker(); };

  btnGroup.appendChild(minBtn);
  btnGroup.appendChild(closeBtn);
  titleBar.appendChild(titleLeft);
  titleBar.appendChild(btnGroup);

  iframe = document.createElement('iframe');
  iframe.src = `${WIDGET_ORIGIN}?org=${orgKey}`;
  iframe.id = 'infodot-widget';
  iframe.allow = 'microphone';
  iframe.style.cssText = 'width:380px;height:520px;border:none;display:block;';

  wrapper.appendChild(titleBar);
  wrapper.appendChild(iframe);
  document.body.appendChild(wrapper);

  minBtn.onclick = () => setMinimized(!isMinimized);
  titleBar.addEventListener('click', (e) => {
    if (isMinimized && e.target !== minBtn && e.target !== closeBtn) setMinimized(false);
  });

  dragOverlay = document.createElement('div');
  dragOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999998;display:none;cursor:move;';
  document.body.appendChild(dragOverlay);

  let isDragging = false;
  let ox = 0, oy = 0;

  titleBar.addEventListener('mousedown', (e) => {
    if (e.target === minBtn || e.target === closeBtn || isMinimized) return;
    isDragging = true;
    const r = wrapper.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    dragOverlay.style.display = 'block';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    wrapper.style.left = (e.clientX - ox) + 'px';
    wrapper.style.top = (e.clientY - oy) + 'px';
    wrapper.style.bottom = 'auto';
    wrapper.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    dragOverlay.style.display = 'none';
  });

  window.addEventListener('message', (e) => {
    if (e.origin !== WIDGET_ORIGIN) return;
    const msg = e.data;

    switch (msg.type) {
      case 'widget:ready':
        if (readyCallback) readyCallback();
        break;
      case 'action:insert':
        if (actionCallback) actionCallback(msg.payload);
        break;
      case 'widget:resize':
        if (iframe) iframe.style.height = msg.payload.height + 'px';
        break;
      default:
        break;
    }
  });

  // Start collapsed by default
  setMinimized(true);
}

export function watchText(elementId, opts = {}) {
  const el = document.getElementById(elementId);
  if (!el) { console.warn(`[SDK] Element #${elementId} not found`); return; }

  const label = opts.label || elementId;
  const debounce = opts.debounce !== undefined ? opts.debounce : 300;

  function getValue() {
    return el.isContentEditable ? el.innerText : el.value;
  }

  function onInput() {
    const value = getValue();
    if (eventLogCallback) eventLogCallback({ type: 'text-changed', elementId, label, value });
    sendDebounced(elementId, {
      type: 'element:text-changed',
      payload: { elementId, label, value, timestamp: Date.now() }
    }, debounce);
  }

  el.addEventListener('input', onInput);

  if (el.isContentEditable) {
    const mo = new MutationObserver(onInput);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    watchers.push({ type: 'mutation', observer: mo });
  }

  watchers.push({ type: 'event', el, event: 'input', fn: onInput });

  const initValue = getValue();
  if (initValue) {
    send({ type: 'element:text-changed', payload: { elementId, label, value: initValue, timestamp: Date.now() } });
  }
}

export function watchClick(elementId, opts = {}) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const label = opts.label || el.innerText || elementId;

  function onClick() {
    if (eventLogCallback) eventLogCallback({ type: 'clicked', elementId, label });
    send({ type: 'element:clicked', payload: { elementId, label, timestamp: Date.now() } });
  }

  el.addEventListener('click', onClick);
  watchers.push({ type: 'event', el, event: 'click', fn: onClick });
}

export function watchSelect(elementId, opts = {}) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const label = opts.label || elementId;

  function onChange() {
    const value = el.value;
    const selectedText = el.options ? el.options[el.selectedIndex].text : value;
    if (eventLogCallback) eventLogCallback({ type: 'selection-changed', elementId, label, value: selectedText });
    send({
      type: 'element:selection-changed',
      payload: { elementId, label, value, selectedText, timestamp: Date.now() }
    });
  }

  el.addEventListener('change', onChange);
  watchers.push({ type: 'event', el, event: 'change', fn: onChange });
  onChange();
}

export function setContext(ctx) {
  // Context update is not user activity — use send() directly (no flicker)
  send({ type: 'context:update', payload: ctx });
}

export function onAction(callback) {
  actionCallback = callback;
}

export function destroy() {
  watchers.forEach((w) => {
    if (w.type === 'event') w.el.removeEventListener(w.event, w.fn);
    if (w.type === 'mutation') w.observer.disconnect();
  });
  watchers = [];
  debounceTimers = {};
  clearTimeout(flickerTimer);
  flickerTimer = null;
  if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
  if (dragOverlay && dragOverlay.parentNode) dragOverlay.parentNode.removeChild(dragOverlay);
  wrapper = null;
  titleBar = null;
  notifDot = null;
  iframe = null;
  minBtn = null;
}
