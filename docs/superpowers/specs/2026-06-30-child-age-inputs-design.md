# Child Age Inputs Design

## Summary

Replace the single shared child-age control in the search form with separate numeric inputs for each child. Keep the existing adult and child count selectors, cap children at four, and serialize child ages into the existing `Ages` query parameter format so downstream ORS, verify, product, and checkout flows continue to work unchanged.

## Goals

- Support up to four children in the search form.
- Let users set each child age separately.
- Default newly added children to age `0`.
- Keep URL/query behavior compatible with existing downstream parsing.
- Limit the change to the search UI and its parameter-building logic.

## Non-Goals

- Redesign the broader search form layout.
- Change ORS payload structure or downstream checkout logic.
- Introduce add/remove repeater controls instead of the existing child count select.

## Current State

`components/SearchBox.tsx` stores:

- `childCount` as the number of children
- `childAge` as one shared age for all children

When building query params, it serializes:

- `AdultCount`
- `ChildCount`
- `Ages` as `[30...adultCount, childAge...childCount]`

The rest of the application already accepts distinct child ages through `Ages`, including `lib/ors.ts`, `components/DateRow.tsx`, verify routes, product pages, and checkout flows.

## Proposed Approach

Keep the current `Otroci` select and replace the single shared child-age control with one numeric input per child.

This is the smallest change that satisfies the requirement:

- preserves the current interaction for choosing child count
- avoids a larger layout redesign
- maps directly onto the existing `Ages` serialization format

## State Model

In `components/SearchBox.tsx`:

- Keep `adultCount: number`
- Keep `childCount: number`
- Replace `childAge: number` with `childAges: number[]`

Behavior:

- Initialize `childAges` from `defaultAges`
- Parse the child portion of `defaultAges` after the adult entries
- If there are fewer parsed child ages than `childCount`, fill missing values with `0`
- If there are more parsed child ages than `childCount`, truncate to `childCount`
- When `childCount` increases, append `0` values for each new child
- When `childCount` decreases, truncate the array

## Parsing Rules

Hydration from URL/search params should accept the existing `Ages` formats already used elsewhere:

- If `Ages` contains only child ages, use them as the child values
- If `Ages` contains adult ages followed by child ages, skip the first `adultCount` entries and use the remaining child values
- Invalid or missing values fall back to `0`

This preserves compatibility with current URLs and with pages that pass through the full `Ages` list.

## UI Changes

In the traveler section of `components/SearchBox.tsx`:

- Keep the `Odrasli` select unchanged
- Keep the `Otroci` select unchanged with values `0..4`
- Remove the single slider/shared-age block
- When `childCount > 0`, render one stacked numeric input per child

Each input:

- Label: `Otrok 1`, `Otrok 2`, `Otrok 3`, `Otrok 4`
- Type: `number`
- Attributes: `min="0"` and `max="17"`
- Default value for new rows: `0`

Interaction rules:

- Updates write to the corresponding index in `childAges`
- Values are clamped to the integer range `0..17`
- Empty intermediate input during editing should not poison the state; the implementation should normalize safely so built query params always remain valid

## Query Serialization

`buildSearchParams()` should continue to produce:

- `AdultCount`
- `ChildCount`
- `Ages`

Serialization rules:

- Adult ages remain `30` repeated `adultCount` times
- Child ages come from `childAges.slice(0, childCount)`
- Final format: `[...Array(adultCount).fill(30), ...childAges].join(",")`
- If `childCount === 0`, omit `ChildCount` and `Ages` via existing sanitization behavior

No changes are required to downstream consumers if the query continues to follow this format.

## Testing Strategy

Add focused tests around the parsing and serialization logic extracted for child age handling.

Required coverage:

1. No children removes `ChildCount` and `Ages`
2. One child serializes one distinct age
3. Multiple children preserve separate ages in order
4. Missing parsed ages backfill with `0`
5. Adult-prefixed `Ages` values hydrate correctly into child inputs
6. Child count decreases truncate extra ages
7. Ages outside the supported range normalize into `0..17`

Because the downstream logic already supports distinct ages, the initial test scope should stay focused on search-form behavior unless implementation reveals a mismatch.

## Risks

- State hydration can be off by one if adult-prefixed age parsing is inconsistent with current URL shape
- Numeric inputs can briefly produce empty or invalid values while the user is editing, so normalization must be explicit
- Layout may need a small CSS adjustment if the stacked child inputs create spacing issues on mobile

## Rollout

- Implement the search-form state and UI change
- Add targeted tests for parsing/serialization behavior
- Run the relevant test subset and a quick manual verification of the search URL output
