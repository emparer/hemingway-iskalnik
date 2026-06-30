# Embed Minimal Search Design

## Summary

Redesign the `/embed/search` iframe search UI so it shows only the essential fields needed before redirecting to the full site. The iframe should display a dropdown for offer type, destination autocomplete, departure date, and return date, in that order. All other search options remain available only after the user lands on the real page.

## Goals

- Keep the redesign isolated to the iframe route only.
- Replace the current offer-type tabs in the iframe with a real dropdown.
- Show only four visible search fields in the iframe:
  - offer type
  - destination
  - departure date
  - return date
- Preserve the existing destination autocomplete behavior.
- Keep redirect behavior to the full site unchanged.
- Leave the full-site search UI untouched.

## Non-Goals

- Redesign the full-site search form.
- Change query-building or redirect semantics beyond what is required for the iframe variant.
- Remove or refactor shared search logic outside the embed-focused rendering branch.
- Add new business rules for hidden filters such as travelers, airport, or duration.

## Current State

`app/embed/search/page.tsx` renders the shared `SearchBox` in:

- `compact` mode
- `submitMode="external"`

That means the iframe currently shares nearly all of the full search UI, including:

- offer type tabs
- destination autocomplete
- date fields
- traveler fields
- children controls
- airport, duration, service, category, and subtype controls

This makes the iframe heavier than desired for a lead-in search experience.

## Proposed Approach

Add an iframe-only variant to `SearchBox` instead of introducing a second search component.

Recommended implementation:

- pass a new prop from `app/embed/search/page.tsx`, for example `variant="embed-minimal"`
- branch rendering inside `components/SearchBox.tsx` for that variant
- keep the existing state, autocomplete, query construction, and external submit flow
- add dedicated CSS hooks so the embed layout is intentional and isolated

This keeps behavior centralized while limiting the visual and structural difference to the iframe route.

## Visible Iframe UI

In the iframe variant only, render the fields in this order:

1. `Tip ponudbe` dropdown
2. destination autocomplete
3. departure date
4. return date
5. submit button

The offer type control should be a real `<select>`, not tabs.

Options:

- `Počitnice z letalom`
- `Samo nastanitev`
- `Potovanja`

The destination field should keep the current autocomplete behavior and suggestion flow.

The submit button should continue redirecting to the real full page.

## Hidden Iframe UI

In the iframe variant, do not render:

- offer-type tabs
- mobile search collapse toggle
- adults
- children
- child ages
- airport
- duration
- service
- category
- subtype

These values can still keep their existing defaults internally, but they should not be visible in the iframe.

## Data Flow

The iframe variant should keep using the same shared search logic for:

- search target resolution
- autocomplete
- query parameter building
- external redirect URL construction

Expected behavior:

- the iframe collects `type`, `query`, `StartDate`, and `EndDate`
- on submit it redirects to the full site with those values
- once on the full site, the user sees the normal full `SearchBox` and the rest of the search options

No separate query-building path should be introduced unless implementation reveals a concrete need.

## Implementation Boundaries

### `app/embed/search/page.tsx`

- Pass the new iframe-specific variant prop into `SearchBox`
- Keep `compact` and `submitMode="external"` behavior unless implementation makes one of them unnecessary

### `components/SearchBox.tsx`

- Add support for the iframe-only rendering variant
- Replace tabs with a dropdown only in that variant
- Render only the reduced field list for that variant
- Keep full-page rendering unchanged

### `app/globals.css`

- Add targeted styles for the iframe variant only
- Avoid using generic selectors that could affect the full search form

## Testing Strategy

Primary verification can stay lightweight:

- manual check that `/embed/search` renders only the four requested fields plus submit
- manual check that destination autocomplete still works
- manual check that submit redirects to the full page with `type`, `query`, `StartDate`, and `EndDate`
- manual check that the normal full-site `SearchBox` remains unchanged

Automated testing:

- add a focused scratch/query test only if the iframe variant requires a new query-building branch
- otherwise avoid adding tests that merely duplicate existing shared behavior

## Risks

- Shared render branching in `SearchBox.tsx` could accidentally affect the full-page form if the variant guard is too loose
- Styling changes in `app/globals.css` could leak into the normal search experience if selectors are not specific
- Hiding too much through CSS instead of render logic would leave dead UI in the DOM and make future embed changes fragile

## Decision

Use a dedicated iframe-only `SearchBox` variant with a real offer-type dropdown and a reduced visible field set. Keep autocomplete, query logic, and external redirect behavior shared with the full experience.
