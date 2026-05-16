'use strict';

import { updateState } from './state.js';

export function attachEventHandlers() {
  const root = document.body || document.documentElement;
  root.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const { action, view } = target.dataset;
    if (action === 'showView' && view) {
      window.showView?.(view, target);
      updateState({ currentView: view });
    }
  });
}
