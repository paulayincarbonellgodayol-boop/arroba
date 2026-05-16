'use strict';

import { getState } from './state.js';

export function renderApp() {
  const state = getState();
  const view = state.currentView || 'dashboard';
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.id === `view-${view}`));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
}
