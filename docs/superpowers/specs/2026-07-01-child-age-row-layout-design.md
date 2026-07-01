# Child Age Row Layout Design

## Summary

Adjust the child age inputs in the main search form so they render in one horizontal row on desktop and tablet, while remaining stacked in a column on mobile. The change should make the age boxes visually smaller than the main search controls without changing any child-age behavior or serialization logic.

## Goals

- Keep the existing child-age feature and labels intact.
- Render child age inputs in a single horizontal row on larger screens.
- Force the child age inputs back into a vertical column on mobile.
- Make the child age boxes smaller and visually lighter than the main search fields.
- Limit the change to child-age layout and styling only.

## Non-Goals

- Change child-age state handling or serialization.
- Change the traveler count controls.
- Redesign the rest of the search form.
- Change the iframe-specific search layout.

## Current State

In `components/SearchBox.tsx`, the child age inputs are rendered as:

- a `Starost otrok` section
- one labeled input per child (`Otrok 1`, `Otrok 2`, etc.)
- an inner wrapper using vertical grid layout

That makes the child age inputs stack in one column at all sizes and take more vertical space than necessary on desktop.

## Proposed Approach

Keep the same child-age section and input behavior, but replace the inline layout styles with dedicated class-based markup and responsive CSS.

Recommended implementation:

- add semantic wrapper classes in `components/SearchBox.tsx`
- move child-age layout styling into `app/globals.css`
- use a horizontal row layout by default
- switch back to a forced column layout in the mobile breakpoint

This keeps the behavior unchanged while making the layout easier to maintain.

## Layout Rules

### Desktop and Tablet

The child-age inputs should:

- render on one horizontal row
- keep the `Starost otrok` heading above them
- keep each child label visible
- use narrower input widths than the main search controls

Expected structure:

- section heading
- horizontal row of compact child-age cards/fields

### Mobile

On mobile, the child-age inputs should:

- switch to a vertical column
- keep the same labels and input behavior
- preserve readability and tap target size

The mobile version should be intentionally stacked, not just wrapped unpredictably.

## Implementation Boundaries

### `components/SearchBox.tsx`

- Replace inline styles inside the child-age block with class names
- Keep the same child count mapping and `handleChildAgeChange(index, value)` behavior
- Keep the same labels: `Starost otrok` and `Otrok N`

### `app/globals.css`

- Add dedicated child-age layout classes
- Default to horizontal row layout
- Apply smaller widths and spacing for the compact child age inputs
- Add a mobile breakpoint rule that forces the inputs back into a column

## UX Notes

- “Smaller” should affect width and local spacing, not make the controls unusably short
- The controls should still look consistent with the rest of the search UI
- The mobile column layout is intentional and should not depend on browser wrapping behavior alone

## Testing Strategy

Primary verification can stay lightweight:

- desktop/tablet check: child age inputs appear in one row
- mobile check: child age inputs appear in one column
- verify that changing ages still updates normally
- verify that submit behavior remains unchanged

No new behavioral tests are required unless implementation accidentally changes child-age logic.

## Risks

- CSS changes could unintentionally affect the main search grid if selectors are too broad
- Over-shrinking the controls could hurt usability
- Relying on inline width values instead of dedicated classes would make the layout harder to adjust later

## Decision

Implement the child-age layout with dedicated markup classes and responsive CSS: one row on larger screens, forced column on mobile, and smaller visual footprint overall.
