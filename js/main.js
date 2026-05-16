'use strict';

import { initState, subscribe } from './state.js';
import { attachEventHandlers } from './events.js';
import { renderApp } from './render.js';

function initApp() {
  initState();
  attachEventHandlers();
  subscribe(renderApp);
  renderApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
