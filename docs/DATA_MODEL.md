# ROBA Data Model

Checkpoint: CP3
Date: 2026-05-16

This document describes the data shapes used by the current working app. It documents reality; it does not introduce validation or runtime changes.

## IndexedDB

- Database: `roba_db`
- Version: `3`

Stores:

- `items`
- `wears`
- `meta`
- `outfits`
- `trash`

## Item

Stored in `items`.

Core fields:

```js
{
  id: string,
  category: string,
  brand: string,
  name: string,
  color: string,
  colors?: string[],
  type: string,
  seasons: string[],
  formality: string[],
  price: number,
  quantity: number,
  units: Unit[],
  totalCost: number,
  wears: number,
  cpw: number,
  purchaseYear: string,
  size: string,
  images: string[],
  favourite: boolean,
  needsInfo: boolean,
  retired?: boolean,
  retiredUnits?: number,
  notes: string,
  lastWorn: string | null,
  seeded: boolean
}
```

### Compatibility Notes

- `color` is the legacy display field and remains important.
- `colors` is the newer array field.
- Rendering should continue to support both:
  - prefer `colors` when it is an array with values
  - fall back to splitting `color`
- Ghost items created from free-text log entries use `needsInfo: true`.

### Derived Fields

- `totalCost` is `price * total unit count`.
- `quantity` is active unit count, not always total historical units.
- `wears` is incremented when log entries are added.
- `cpw` is `totalCost / wears` when `wears > 0`; otherwise it is usually `totalCost`.
- `lastWorn` is the latest wear date known for the item.

These fields are currently stored, not computed on every render. Refactors must preserve this behavior unless a later checkpoint explicitly changes it with a migration plan.

## Unit

Stored inside an item in `item.units`.

```js
{
  id: string,
  purchaseDate: string,
  purchaseYear: string,
  retired: boolean,
  retiredDate: string
}
```

Notes:

- `purchaseDate` is an ISO date string when known.
- Seeded items use `YYYY-01-01` when only purchase year is known.
- Retired units remain part of `units` and continue contributing to historical cost.

## Wear

Stored in `wears`.

Seeded wear entries may be minimal:

```js
{
  id?: number,
  date: string,
  itemId: string,
  outfitLabel: string,
  seeded: boolean
}
```

User-created log entries may include:

```js
{
  id?: number,
  date: string,
  itemId: string,
  outfitId: string | null,
  outfitLabel: string,
  ocasions?: string[],
  freeText: string | null,
  catKey: string,
  seeded: boolean
}
```

Notes:

- `id` is auto-incremented by IndexedDB.
- `itemId` should reference an item, but imports and old data may require defensive rendering.
- `outfitId` groups multiple wear rows into one outfit/day entry.
- `ocasions` is an array of occasion names.
- `freeText` is used for ghost/free-text pieces.

## Outfit

Stored in `outfits`.

```js
{
  id: string,
  name: string,
  pieces: OutfitPiece[],
  createdAt: string,
  wears: number,
  lastWorn: string | null,
  favourite: boolean
}
```

### OutfitPiece

```js
{
  catKey: string,
  itemId: string,
  text: string
}
```

Notes:

- Wearing a saved outfit creates new `wears` rows.
- The saved outfit also increments its own `wears` count and updates `lastWorn`.

## Meta

Stored in `meta` with `key` as the primary key.

Known records:

```js
{ key: 'seeded', value: true, version: 1 }
```

```js
{ key: 'ocasions', value: Ocasio[] }
```

### Ocasio

```js
{
  id: string,
  name: string,
  preset: boolean
}
```

## Trash

Stored in `trash`.

Trash records are item objects plus:

```js
{
  deletedAt: number
}
```

Notes:

- Items moved to trash are deleted from `items`.
- Restoring removes `deletedAt` and puts the item back into `items`.
- Trash cleanup permanently removes entries after 24 hours.

## Backup Format

Exported JSON currently uses:

```js
{
  version: 2,
  exportedAt: string,
  items: Item[],
  wears: Wear[],
  meta: MetaRecord[]
}
```

Import behavior:

- Adds missing items by `id`.
- Adds missing wears by dedupe key: `date|itemId|outfitId`.
- Does not currently replace existing records.

## Refactor Guardrails

- Do not remove `color` while existing UI and backups may depend on it.
- Do not recompute and stop storing `wears`, `cpw`, `totalCost`, or `lastWorn` without a deliberate migration.
- Do not change store names or key paths without a database migration.
- Keep import/export compatible with existing backups.
- Preserve defensive rendering for old, seeded, imported, and ghost records.

## Debug Checker

CP4 added a read-only browser console helper:

```js
await window.robaDebug.checkData()
```

It reads `items`, `wears`, `outfits`, `meta`, and `trash`, then returns:

```js
{
  ok: boolean,
  counts: object,
  warningCount: number,
  byType: object,
  warnings: array
}
```

The checker logs tables to the console and returns the same structured result. It does not mutate IndexedDB, render UI, repair data, or change app behavior.
