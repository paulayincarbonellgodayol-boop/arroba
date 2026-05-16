'use strict';

const state = {
  currentView: 'dashboard',
  items: [],
  wears: [],
  outfits: [],
  ocasions: [],
  filters: {
    search: '',
    priceMin: '',
    priceMax: '',
    cpuMin: '',
    cpuMax: '',
  },
  ui: {
    activeModal: null,
    selectMode: false,
  },
};

const listeners = new Set();

export function initState(initialData = {}) {
  Object.assign(state, initialData);
}

export function getState() {
  return state;
}

export function updateState(patch) {
  Object.assign(state, patch);
  listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
