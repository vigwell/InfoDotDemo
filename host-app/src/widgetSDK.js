/**
 * YourProduct Widget Loader SDK
 * 
 * This is the SDK that runs on the HOST page.
 * In production, this would be served from your CDN as loader.js
 * In this POC, it's imported directly into the host app.
 */

const WIDGET_ORIGIN = 'http://localhost:3001';

let iframe = null;
let wrapper = null;
let dragOverlay = null;
let watchers = [];
let debounceTimers = {};
let actionCallback = null;
let readyCallback = null;
let eventLogCallback = null;

function send(msg) {
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(msg, WIDGET_ORIGIN);
  }
}

function sendDebounced(elementId, msg, delay) {
  clearTimeout(debounceTimers[elementId]);
  debounceTimers[elementId] = setTimeout(() => {
    send(msg);
  }, delay || 300);
}

export function init(config = {}) {
  const { orgKey = 'demo_org', position = 'right', onReady, onEvent } = config;

  readyCallback = onReady;
  eventLogCallback = onEvent;

  // Floating wrapper
  wrapper = document.createElement('div');
  wrapper.id = 'yourproduct-widget-wrapper';
  wrapper.style.cssText =
    'position:fixed;bottom:80px;right:20px;width:380px;border-radius:16px;' +
    'box-shadow:0 8px 48px rgba(79,143,247,0.35),0 2px 16px rgba(0,0,0,0.6);z-index:999999;overflow:hidden;user-select:none;' +
    'border:2px solid #4f8ff7;transition:width 0.2s,border-radius 0.2s;';

  // Drag handle / title bar
  const titleBar = document.createElement('div');
  titleBar.style.cssText =
    'height:40px;background:linear-gradient(135deg,#1a2a4a 0%,#1a1d27 100%);border-bottom:1px solid #4f8ff750;' +
    'display:flex;align-items:center;padding:0 12px;cursor:move;justify-content:space-between;flex-shrink:0;';

  const titleText = document.createElement('span');
  titleText.textContent = '✦ InfoDot Assist';
  titleText.style.cssText = 'color:#4f8ff7;font-size:13px;font-weight:700;font-family:system-ui;letter-spacing:0.3px;white-space:nowrap;';

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

  const minBtn = makeBtn('▼', 'Minimize');
  const closeBtn = makeBtn('×', 'Close');
  closeBtn.style.fontSize = '18px';
  closeBtn.onmouseenter = () => { closeBtn.style.background = '#ef444430'; closeBtn.style.color = '#ef4444'; };
  closeBtn.onmouseleave = () => { closeBtn.style.background = 'none'; closeBtn.style.color = '#8b90a0'; };
  closeBtn.onclick = () => { wrapper.style.display = 'none'; };

  btnGroup.appendChild(minBtn);
  btnGroup.appendChild(closeBtn);
  titleBar.appendChild(titleText);
  titleBar.appendChild(btnGroup);

  // iframe
  iframe = document.createElement('iframe');
  iframe.src = `${WIDGET_ORIGIN}?org=${orgKey}`;
  iframe.id = 'yourproduct-widget';
  iframe.allow = 'microphone';
  iframe.style.cssText = 'width:380px;height:520px;border:none;display:block;';

  wrapper.appendChild(titleBar);
  wrapper.appendChild(iframe);
  document.body.appendChild(wrapper);

  // Minimize / maximize logic
  let isMinimized = false;

  function setMinimized(min) {
    isMinimized = min;
    if (min) {
      iframe.style.display = 'none';
      titleBar.style.borderBottom = 'none';
      titleBar.style.cursor = 'pointer';
      wrapper.style.width = '190px';
      wrapper.style.bottom = '20px';
      wrapper.style.right = '20px';
      wrapper.style.top = 'auto';
      wrapper.style.left = 'auto';
      wrapper.style.borderRadius = '20px';
      minBtn.textContent = '▲';
      minBtn.title = 'Restore';
    } else {
      iframe.style.display = 'block';
      titleBar.style.borderBottom = '1px solid #2a2e3f';
      titleBar.style.cursor = 'move';
      wrapper.style.width = '380px';
      wrapper.style.borderRadius = '16px';
      minBtn.textContent = '▼';
      minBtn.title = 'Minimize';
    }
  }

  minBtn.onclick = () => setMinimized(!isMinimized);
  // Clicking the collapsed pill also restores
  titleBar.addEventListener('click', (e) => {
    if (isMinimized && e.target !== minBtn && e.target !== closeBtn) setMinimized(false);
  });

  // Transparent overlay to capture mouse events when dragging over the iframe
  dragOverlay = document.createElement('div');
  dragOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999998;display:none;cursor:move;';
  document.body.appendChild(dragOverlay);

  // Drag logic
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

  // Listen for messages FROM the widget
  window.addEventListener('message', (e) => {
    if (e.origin !== WIDGET_ORIGIN) return;
    const msg = e.data;

    switch (msg.type) {
      case 'widget:ready':
        console.log('[SDK] Widget is ready');
        if (readyCallback) readyCallback();
        break;

      case 'action:insert':
        console.log('[SDK] Insert action:', msg.payload);
        if (actionCallback) actionCallback(msg.payload);
        break;

      case 'widget:resize':
        if (iframe) iframe.style.height = msg.payload.height + 'px';
        break;

      default:
        break;
    }
  });
}

export function watchText(elementId, opts = {}) {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`[SDK] Element #${elementId} not found`);
    return;
  }

  const label = opts.label || elementId;
  const debounce = opts.debounce !== undefined ? opts.debounce : 300;

  function getValue() {
    if (el.isContentEditable) return el.innerText;
    return el.value;
  }

  function onInput() {
    const value = getValue();
    if (eventLogCallback) {
      eventLogCallback({ type: 'text-changed', elementId, label, value });
    }
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

  // Send initial value
  const initValue = getValue();
  if (initValue) {
    send({
      type: 'element:text-changed',
      payload: { elementId, label, value: initValue, timestamp: Date.now() }
    });
  }
}

export function watchClick(elementId, opts = {}) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const label = opts.label || el.innerText || elementId;

  function onClick() {
    if (eventLogCallback) {
      eventLogCallback({ type: 'clicked', elementId, label });
    }
    send({
      type: 'element:clicked',
      payload: { elementId, label, timestamp: Date.now() }
    });
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
    if (eventLogCallback) {
      eventLogCallback({ type: 'selection-changed', elementId, label, value: selectedText });
    }
    send({
      type: 'element:selection-changed',
      payload: { elementId, label, value, selectedText, timestamp: Date.now() }
    });
  }

  el.addEventListener('change', onChange);
  watchers.push({ type: 'event', el, event: 'change', fn: onChange });

  // Send initial
  onChange();
}

export function setContext(ctx) {
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
  if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
  if (dragOverlay && dragOverlay.parentNode) dragOverlay.parentNode.removeChild(dragOverlay);
  wrapper = null;
  dragOverlay = null;
  iframe = null;
}
