# Child Age Row Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the child age inputs in the main search form so they appear in one horizontal row on desktop/tablet, while forcing a stacked column layout on mobile, without changing child-age behavior.

**Architecture:** Keep the existing child-age state and submit logic untouched. Replace the current inline child-age layout styles in `SearchBox` with dedicated markup classes, then add scoped CSS in `app/globals.css` for desktop row layout and mobile column layout.

**Tech Stack:** Next.js App Router, React client components, TypeScript, shared CSS in `app/globals.css`

---

## File Structure

- Modify: `components/SearchBox.tsx`
  - Replaces inline child-age wrapper styles with semantic class-based markup.
- Modify: `app/globals.css`
  - Adds child-age row layout classes and responsive rules for desktop/tablet vs mobile.

### Task 1: Replace inline child-age layout with semantic markup

**Files:**
- Modify: `components/SearchBox.tsx`

- [x] **Step 1: Write the failing test**

Introduce the new class-based structure in the JSX before adding CSS:

```tsx
{!isEmbedMinimal && childCount > 0 && (
  <div className="sg-field sg-field-child-age">
    <label>Starost otrok</label>
    <div className="child-age-row">
      {Array.from({ length: childCount }, (_, index) => (
        <div key={index} className="child-age-item">
          <label className="child-age-item-label">{`Otrok ${index + 1}`}</label>
          <input
            className="sg-control child-age-input"
            type="number"
            min={0}
            max={17}
            value={childAges[index] ?? 0}
            onChange={e => handleChildAgeChange(index, e.target.value)}
          />
        </div>
      ))}
    </div>
  </div>
)}
```

At this step, no CSS exists for the new classes, so the layout should not yet match the desired desktop row/mobile column behavior.

- [x] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: PASS at build level, but manual layout requirement still fails because the new classes have no desktop-row/mobile-column styling yet

- [x] **Step 3: Write minimal implementation**

Update `components/SearchBox.tsx` by replacing this existing inline block:

```tsx
<div style={{ display: "grid", gap: "8px" }}>
  {Array.from({ length: childCount }, (_, index) => (
    <div key={index} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "11px", color: "var(--muted)" }}>
        {`Otrok ${index + 1}`}
      </label>
      <input
        className="sg-control"
        type="number"
        min={0}
        max={17}
        value={childAges[index] ?? 0}
        onChange={e => handleChildAgeChange(index, e.target.value)}
      />
    </div>
  ))}
</div>
```

with:

```tsx
<div className="child-age-row">
  {Array.from({ length: childCount }, (_, index) => (
    <div key={index} className="child-age-item">
      <label className="child-age-item-label">{`Otrok ${index + 1}`}</label>
      <input
        className="sg-control child-age-input"
        type="number"
        min={0}
        max={17}
        value={childAges[index] ?? 0}
        onChange={e => handleChildAgeChange(index, e.target.value)}
      />
    </div>
  ))}
</div>
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS with no TypeScript or JSX errors after the markup conversion

- [x] **Step 5: Commit**

```bash
git add components/SearchBox.tsx
git commit -m "refactor: add semantic child age layout markup"
```

### Task 2: Add desktop row and mobile column child-age styling

**Files:**
- Modify: `app/globals.css`

- [x] **Step 1: Write the failing test**

Add the class names in CSS with only placeholder selectors first:

```css
.child-age-row {}
.child-age-item {}
.child-age-item-label {}
.child-age-input {}
```

This should still fail the product requirement because the controls will not yet shrink or align horizontally on desktop.

- [x] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: PASS at build level, but manual layout requirement still fails because the new selectors do not yet change layout

- [x] **Step 3: Write minimal implementation**

Add desktop/tablet styling near the existing search-form rules in `app/globals.css`:

```css
.child-age-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.child-age-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 0 0 96px;
}

.child-age-item-label {
  font-size: 11px;
  color: var(--muted);
}

.child-age-input {
  min-height: 38px;
  padding: 8px 10px;
}
```

Then add a mobile override in the existing small-screen responsive area:

```css
@media (max-width: 760px) {
  .child-age-row {
    flex-direction: column;
    gap: 8px;
  }

  .child-age-item {
    flex: none;
    width: 100%;
  }
}
```

If the repo’s current mobile breakpoint is better handled in a different existing responsive block, place the override there instead, but keep the behavior the same.

- [x] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS with the new child-age layout classes in place

- [x] **Step 5: Run final verification**

Run:

```bash
npm run build
```

Expected manual verification:

1. On desktop/tablet, the child age inputs appear in one horizontal row
2. The child age inputs are visibly smaller/narrower than the main search controls
3. On mobile, the child age inputs stack vertically in one column
4. Child age editing still works and no other search fields are affected

- [x] **Step 6: Commit**

```bash
git add app/globals.css components/SearchBox.tsx
git commit -m "feat: arrange child age inputs in a responsive row"
```
