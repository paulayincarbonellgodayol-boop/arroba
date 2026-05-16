# ROBA Checkpoint Log

This log records architecture and stabilization work. Each checkpoint should preserve UI, design, capabilities, labels, navigation, and existing data behavior unless a visible change is explicitly requested.

## CP1 - Architecture Inventory

Date: 2026-05-16

### What Changed

- Added `ARCHITECTURE_INVENTORY.md`.
- Documented the active runtime files:
  - `index.html`
  - `styles.css`
  - `utils.js`
  - `app.js`
- Documented that the `js/` folder is currently inactive because `index.html` does not load it.
- Recorded current IndexedDB stores and major code responsibility areas.
- Added explicit refactor guardrails to avoid UI, capability, or design changes.

### Why

- Establish a known architectural map before refactoring.
- Avoid treating partial refactor files as active source of truth.
- Make future checkpoints smaller, safer, and easier to review.

### Files Touched

- `ARCHITECTURE_INVENTORY.md`

### Intentionally Not Changed

- No HTML behavior.
- No CSS behavior.
- No JavaScript runtime behavior.
- No IndexedDB schema or migration.
- No UI, layout, labels, or app capabilities.

### Verification

- Confirmed `index.html` loads only `styles.css`, `utils.js`, and `app.js`.
- Confirmed local preview still serves `index.html` successfully at `http://localhost:8001/index.html`.

### Remaining Risk / Follow-Up

- The inactive `js/` folder can confuse future work. Recommended next checkpoint: quarantine or remove inactive refactor debris after confirming again that it is unused.
- Resolved in CP2.

## CP2 - Quarantine Inactive Refactor Files

Date: 2026-05-16

### What Changed

- Re-confirmed that `index.html` loads only:
  - `utils.js`
  - `app.js`
- Moved the inactive modular refactor files from `js/` to `inactive_refactor/js/`.
- Added `inactive_refactor/README.md` to explain that these files are retained only for reference.
- Updated `ARCHITECTURE_INVENTORY.md` to point to the quarantined location.

### Why

- Reduce architecture confusion without deleting potentially useful reference work.
- Keep the active runtime path obvious and stable.
- Avoid accidental edits to inactive files that do not affect the app.

### Files Touched

- `ARCHITECTURE_INVENTORY.md`
- `inactive_refactor/README.md`
- `inactive_refactor/js/events.js`
- `inactive_refactor/js/main.js`
- `inactive_refactor/js/persistence.js`
- `inactive_refactor/js/render.js`
- `inactive_refactor/js/state.js`

### Intentionally Not Changed

- No `index.html` script tags changed.
- No active CSS changed.
- No active JavaScript logic changed.
- No IndexedDB schema or stored data changed.
- No UI, layout, labels, or app capabilities changed.

### Verification

- Confirmed `index.html` does not load the quarantined files.
- Confirmed local preview still serves `index.html` successfully at `http://localhost:8001/index.html`.

### Remaining Risk / Follow-Up

- The quarantined files are still reference material only. Recommended next checkpoint: document active data shapes before extracting or moving runtime logic.
- Resolved in CP3.

## CP3 - Document Active Data Model

Date: 2026-05-16

### What Changed

- Added `DATA_MODEL.md`.
- Documented active IndexedDB stores:
  - `items`
  - `wears`
  - `meta`
  - `outfits`
  - `trash`
- Documented current shapes for:
  - item
  - unit
  - wear
  - outfit
  - outfit piece
  - meta records
  - occasions
  - trash records
  - backup JSON
- Updated `ARCHITECTURE_INVENTORY.md` to reference `DATA_MODEL.md`.

### Why

- Stabilize the data contract before moving runtime logic.
- Preserve compatibility with existing IndexedDB data and exported backups.
- Make future refactors safer by making derived and legacy fields explicit.

### Files Touched

- `DATA_MODEL.md`
- `ARCHITECTURE_INVENTORY.md`
- `CHECKPOINT_LOG.md`

### Intentionally Not Changed

- No active runtime JavaScript changed.
- No active CSS changed.
- No HTML changed.
- No IndexedDB schema or stored data changed.
- No import/export behavior changed.
- No UI, layout, labels, or app capabilities changed.

### Verification

- Inspected active write paths for seeded items, new/edit item form, log entries, ghost items, saved outfits, trash, meta occasions, import, and export.
- Confirmed local preview still serves `index.html` successfully at `http://localhost:8001/index.html`.

### Remaining Risk / Follow-Up

- The model is documented but not enforced. Recommended next checkpoint: add a small non-invasive debug/check helper or begin extracting pure utilities, depending on whether we want validation before movement.
- Debug/check helper added in CP4.

## CP4 - Read-Only Data Debug Checker

Date: 2026-05-16

### What Changed

- Added a console-only helper exposed as:
  - `window.robaDebug.checkData()`
- The helper reads:
  - `items`
  - `wears`
  - `outfits`
  - `meta`
  - `trash`
- It reports counts and warnings for common data-shape issues.
- Updated `DATA_MODEL.md` with usage notes.

### Why

- Catch bad or surprising data before moving runtime code.
- Provide a small diagnostic tool without introducing a validation framework.
- Keep debugging optional and non-invasive.

### Files Touched

- `app.js`
- `DATA_MODEL.md`
- `CHECKPOINT_LOG.md`

### Intentionally Not Changed

- No UI or layout changed.
- No HTML changed.
- No CSS changed.
- No IndexedDB schema changed.
- No stored data is repaired or mutated by the checker.
- No app behavior changes during normal use.

### Verification

- Confirmed the helper is exposed behind `window.robaDebug.checkData`.
- Confirmed the helper is read-only and only uses `dbGetAll`.
- Confirmed local preview still serves `index.html` successfully at `http://localhost:8001/index.html`.

### Remaining Risk / Follow-Up

- The checker may report existing legacy data warnings. Treat warnings as diagnostics first, not automatic bugs.
- Recommended next checkpoint: run the checker in the browser console and decide whether any warnings deserve targeted cleanup before extracting utilities.

## CP5 - Extract Pure Dashboard Calculation Helpers

Date: 2026-05-16

### What Changed

- Moved four pure helper functions from `app.js` to `utils.js`:
  - `selectHighlights`
  - `computeMonthStats`
  - `getLast12MonthKeys`
  - `computeMonthlyAverage`
- Updated `ARCHITECTURE_INVENTORY.md` to record these helpers under `utils.js`.

### Why

- Reduce `app.js` size without touching rendering, DOM wiring, storage, or UI behavior.
- Keep the extraction low-risk by moving only deterministic helpers that do not read or write DOM or IndexedDB.
- Preserve the existing global function names because `utils.js` already loads before `app.js`.

### Files Touched

- `app.js`
- `utils.js`
- `ARCHITECTURE_INVENTORY.md`
- `CHECKPOINT_LOG.md`

### Intentionally Not Changed

- No HTML changed.
- No CSS changed.
- No IndexedDB schema or stored data changed.
- No rendering markup changed.
- No UI, layout, labels, or app capabilities changed.
- No module system introduced.

### Verification

- Confirmed each moved function now exists only in `utils.js`.
- Confirmed `utils.js` and `app.js` both parse successfully.
- Confirmed local preview still serves `index.html` and `utils.js` successfully at `http://localhost:8001/index.html`.

### Remaining Risk / Follow-Up

- This is still global-script architecture. Recommended next checkpoint: continue with another tiny pure extraction only if the function has no DOM, no IndexedDB, and no rendering side effects.

## CP6 - Extract Dashboard Rendering Helpers

Date: 2026-05-16

### What Changed

- Created `dashboard.js` with 6 functions moved from `app.js`:
  - `getCached`
  - `buildStatStripHTML`
  - `statCardHTML`
  - `highlightCardHTML`
  - `buildMonthSummaryHTML`
  - `renderCPUChart`
- Added `<script src="dashboard.js"></script>` to `index.html`, loaded after `utils.js` and before `app.js`.
- `app.js` reduced from 4307 to 4164 lines (143 lines removed).

### Why

- Move pure HTML builders and canvas renderer out of `app.js` without touching any behavior.
- `renderDashboard` (async, calls DB and app-level functions) stays in `app.js` — too many dependencies to move safely yet.

### Files Touched

- `dashboard.js` (new)
- `app.js`
- `index.html`
- `CHECKPOINT_LOG.md`

### Intentionally Not Changed

- No HTML structure or layout changed.
- No CSS changed.
- No IndexedDB schema or stored data changed.
- No rendering output changed.
- No UI, labels, or app capabilities changed.
- No module system introduced.

### Verification

- Confirmed seam between removed block and WARDROBE section is clean.
- Confirmed `dashboard.js` loads before `app.js` in `index.html`.
- Confirmed `renderCPUChart` and HTML builders are no longer in `app.js`.

### Remaining Risk / Follow-Up

- `renderDashboard` still in `app.js`. Can be moved once persistence helpers are extracted.
- Resolved in CP6-Brands.

## CP6-Brands - Extract Brands Rendering

Date: 2026-05-16

### What Changed

- Created `brands.js` with 2 functions moved from `app.js`:
  - `renderBrands`
  - `filterByBrand`
- Added `<script src="brands.js"></script>` to `index.html`, between `dashboard.js` and `app.js`.
- `app.js` reduced from 4164 to 4116 lines (48 lines removed).

### Why

- Both functions are self-contained within the Brands view with no shared state.
- All runtime dependencies (`dbGetAll`, `showView`, `renderWardrobe`, `wrdActiveFilters`, `updateBadge`, `esc`) remain globals and are resolved at call time, not at load time.

### Files Touched

- `brands.js` (new)
- `app.js`
- `index.html`
- `CHECKPOINT_LOG.md`

### Intentionally Not Changed

- No HTML structure or layout changed.
- No CSS changed.
- No IndexedDB schema or stored data changed.
- No rendering output changed.
- No UI, labels, or app capabilities changed.

### Remaining Risk / Follow-Up

- Recommended next: extract Favourites rendering (`renderFavourites`, `switchFavTab`, `renderFavItems`, `renderFavOutfits`).
- Resolved in CP6-Favourites.

## CP6-Favourites - Extract Favourites Rendering

Date: 2026-05-16

### What Changed

- Created `favourites.js` with 4 functions moved from `app.js`:
  - `renderFavourites`
  - `switchFavTab`
  - `renderFavItems`
  - `renderFavOutfits`
- Added `<script src="favourites.js"></script>` to `index.html`.
- `app.js` reduced from 4116 to 4054 lines (62 lines removed).

### Files Touched

- `favourites.js` (new)
- `app.js`
- `index.html`
- `CHECKPOINT_LOG.md`

### Intentionally Not Changed

- No HTML, CSS, IndexedDB, or UI behavior changed.

### Remaining Risk / Follow-Up

- Recommended next: extract Calendar rendering.
- Resolved in CP6-Calendar.

## CP6-Calendar - Extract Calendar Rendering

Date: 2026-05-16

### What Changed

- Created `calendar.js` with state + all functions moved from `app.js`:
  - `calYear`, `calMonth` (module state)
  - `CAT_COLOR`, `CAT_DOT`, `MONTHS_CA` (local consts)
  - `initCalendarSelectors`, `calJump`, `calMove`, `calGoToday`
  - `renderCalendar`, `openDayModal`
- Removed duplicate section header that existed in original.
- Added `<script src="calendar.js"></script>` to `index.html`.
- `app.js` reduced from 4054 to 3797 lines (257 lines removed).

### Files Touched

- `calendar.js` (new)
- `app.js`
- `index.html`
- `CHECKPOINT_LOG.md`

### Intentionally Not Changed

- No HTML, CSS, IndexedDB, or UI behavior changed.

### Remaining Risk / Follow-Up

- Recommended next: extract Wardrobe rendering.
- Resolved in CP6-Wardrobe.

## CP6-Wardrobe - Extract Wardrobe Rendering

Date: 2026-05-16

### What Changed

- Created `wardrobe.js` with all wardrobe constants, state, and functions moved from `app.js`:
  - Constants: `CAT_LABELS`, `TYPES_BY_CAT`, `SEASON_LABELS`, `FORMAL_LABELS`, `STATUS_LABELS`
  - State: `wrdPage`, `WRD_PER`, `wrdSelectMode`, `wrdSelected`, `wrdActiveFilters`, `wrdFilterBarBuilt`
  - Functions: `buildFilterBar`, `buildMultiPanelWithFlowers`, `buildMultiPanel`, `updateBadge`, `updateClearBtn`, `clearAllFilters`, `toggleSelectMode`, `deleteSelected`, `renderWardrobe`, `buildWardrobeChips`, `buildTypeChips`, `toggleCatChip`, `filterChip`
- `wardrobe.js` loads before `brands.js`, `favourites.js`, `calendar.js`, and `app.js` so shared constants (`CAT_LABELS`, `SEASON_LABELS`, `FORMAL_LABELS`, `TYPES_BY_CAT`) are available to all.
- `app.js` reduced from 3797 to 3488 lines (309 lines removed).

### Files Touched

- `wardrobe.js` (new)
- `app.js`
- `index.html`
- `CHECKPOINT_LOG.md`

### Intentionally Not Changed

- No HTML, CSS, IndexedDB, or UI behavior changed.

### Remaining Risk / Follow-Up

- Continued in CP6b.

## CP6b - Extract Log + Outfits

Date: 2026-05-16

### What Changed

**log.js** (new) — moved from `app.js`:
- Constants: `LOG_CATS`
- State: `logPieces`, `logItemCache`, `logDateInited`, `acHiIdx`
- Functions: `initLogView`, `renderLogCats`, `renderCatRows`, `addLogPiece`, `removeLogPiece`, `onLogInput`, `showDrop`, `pickItem`, `pickGhost`, `onLogKey`, `hiDrop`, `closeDrop`, `closeAllDrops`, `updateLogCPW`, `loadDayHistory`, `deleteOutfit`, `clearLogForm`, `submitLog`
- Note: `clearLogForm` and `submitLog` reference `logOcasioSelected` / `renderLogOcasioSelected` from Ocasions (app.js) — resolved at runtime.

**outfits.js** (new) — moved from `app.js`:
- State: `outfitBuilderPieces`, `historyOutfitsCache`, `historyIMap`, `historySort`, `smartSelectedItem`
- Functions: `initOutfitsView`, `buildHistoryOutfits`, `sortHistoryOutfits`, `renderHistoryOutfits`, `renderSmartSelector`, `renderOutfitBuilder`, `addOutfitBuilderPiece`, `renderOutfitBuilderRows`, `showObDrop`, `checkDuplicateNucleus`, `clearOutfitBuilder`, `saveOutfit`, `renderOutfitsList`, `wearSavedOutfit`, `renderFooter`
- References `LOG_CATS` (log.js) and `CAT_LABELS` (wardrobe.js) — both loaded first.

`app.js` reduced from 3488 to 2658 lines (830 lines removed across both extractions).

### Files Touched

- `log.js` (new), `outfits.js` (new), `app.js`, `index.html`, `CHECKPOINT_LOG.md`

### Intentionally Not Changed

- No HTML, CSS, IndexedDB, or UI behavior changed.

### Remaining Risk / Follow-Up

- `app.js` still contains: persistence, seed data, boot, nav, item modal, item form, trash, export/import, debug, ocasions.
- These are the most coupled sections — stop here and verify before deciding whether to continue.
