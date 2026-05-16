# ROBA Architecture Inventory

Checkpoint: CP1
Date: 2026-05-16

This document records the current working architecture before refactoring. It is intentionally descriptive, not aspirational: the goal is to protect the working UI and capabilities while making later changes smaller and safer.

## Protected Rule

Refactors must not change visible UI, design, labels, navigation behavior, data compatibility, or app capabilities unless explicitly requested.

## Active Runtime Files

`index.html` is the active entry point.

It currently loads:

- `styles.css`
- `utils.js`
- `app.js`

Load order matters. `utils.js` defines globals used by `app.js`, then `app.js` boots the application.

## Quarantined Inactive Files

The previous top-level `js/` folder was not loaded by `index.html` and has been moved to `inactive_refactor/js/` in CP2.

Current inactive files:

- `inactive_refactor/js/main.js`
- `inactive_refactor/js/state.js`
- `inactive_refactor/js/render.js`
- `inactive_refactor/js/events.js`
- `inactive_refactor/js/persistence.js`

These appear to be part of a partial modular refactor. They should not be treated as source of truth until a later checkpoint intentionally adopts or removes them.

## Current Data Stores

The app uses IndexedDB:

- Database: `roba_db`
- Version: `3`

Object stores:

- `items`
- `wears`
- `meta`
- `outfits`
- `trash`

Important compatibility note: item colors may exist as both a legacy `color` string and newer `colors` array. Existing rendering supports both.

Detailed active data shapes are documented in `DATA_MODEL.md`.

## Active Code Areas

### `utils.js`

Shared browser globals:

- color helpers: `colorToHex`, `isColorDark`, `flowerSVG`, `colorPill`, `catIconSVG`
- formatting and safety: `formatDate`, `esc`
- pure dashboard calculations: `selectHighlights`, `computeMonthStats`, `getLast12MonthKeys`, `computeMonthlyAverage`
- UI helpers: `buildPaginator`, `toast`

These helpers are used directly by `app.js`.

### `app.js`

Main responsibilities:

- IndexedDB setup and helpers
- seed data and migration
- boot sequence
- view switching
- dashboard rendering
- wardrobe filters, cards, selection, deletion
- brands view
- item detail modal
- calendar and day modal
- favourites view
- item add/edit form
- log day flow
- trash, backup, import
- outfit history and builder
- footer stats
- occasions

### `styles.css`

Single active stylesheet for all views and components.

Important selector contracts:

- view switching depends on `.view` and `.view.active`
- nav state depends on `.nav-btn.active`
- modals depend on `.modal-bg.open`
- wardrobe cards depend on `.item-card`, `.wardrobe-grid`, `.ic-*`, `.pill-*`
- dashboard depends on `.stat-strip`, `.stat-card`, `.dash-highlights`, `.highlight-card`
- top bar responsiveness depends on horizontal scrolling on `nav`

## Current State Pattern

The app is mostly global browser functions and feature-level globals.

Examples:

- wardrobe state: `wrdPage`, `wrdSelectMode`, `wrdSelected`, `wrdActiveFilters`
- calendar state: `calYear`, `calMonth`
- item form state: `editingItemId`, `formUnits`, `unitCounter`
- log state: `logPieces`, `logItemCache`, `logDateInited`
- outfits state: `outfitBuilderPieces`, `historyOutfitsCache`, `historyIMap`, `historySort`, `smartSelectedItem`
- occasions state: `ocasionsList`, `logOcasioSelected`

This is not elegant, but it is understandable and working. Later checkpoints should group state by feature only when doing so is low-risk.

## Safe Refactor Order

Recommended next checkpoints:

1. Extract pure utilities only if behavior is byte-for-byte equivalent from the app's point of view.
2. Extract IndexedDB persistence only after utilities are stable.
3. Split feature rendering last, one feature at a time.

Avoid:

- introducing a global state manager
- changing HTML structure for architecture reasons
- renaming CSS classes used by existing rendering
- changing IndexedDB schemas without migration
- rewriting rendering logic while extracting files

## CP1 Status

No app behavior changes were made for this checkpoint.
