# Bulk Delete Books Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to select and delete multiple books (or all deletable books) from the catalogue page, with checked-out books protected from deletion.

**Architecture:** Add a `deleteBooks` bulk-delete function to `use-books.ts`. Add selection mode to the catalogue page with checkboxes on each BookCard. A sticky bottom bar shows "Delete Selected" and "Delete All" actions, both gated behind a confirmation dialog. Books with active checkouts have disabled checkboxes and are excluded from "Delete All".

**Tech Stack:** React state, Supabase JS client, existing ConfirmDialog component, Tailwind CSS.

---

### File Map

- **Modify:** `src/lib/hooks/use-books.ts` — add `deleteBooks(ids: string[])` bulk delete
- **Modify:** `src/components/book-card.tsx` — add optional selection mode props (checkbox, disabled state)
- **Modify:** `src/app/(authenticated)/catalogue/page.tsx` — add select mode toggle, selection state, bottom action bar, confirmation dialogs
- **Test:** `__tests__/components/book-card.test.tsx` — add tests for checkbox/selection rendering

---

### Task 1: Add `deleteBooks` bulk delete to `use-books.ts`

**Files:**
- Modify: `src/lib/hooks/use-books.ts`

- [ ] **Step 1: Add `deleteBooks` function**

Add this function inside `useBooks()`, after the existing `deleteBook` function (line 59):

```ts
async function deleteBooks(ids: string[]) {
  const { error } = await supabase.from("books").delete().in("id", ids);
  if (!error) {
    setBooks((prev) => prev.filter((b) => !ids.includes(b.id)));
  }
  return { error };
}
```

- [ ] **Step 2: Add `deleteBooks` to the return object**

Change the return statement from:

```ts
return { books, loading, fetchBooks, addBook, updateBook, deleteBook };
```

to:

```ts
return { books, loading, fetchBooks, addBook, updateBook, deleteBook, deleteBooks };
```

- [ ] **Step 3: Verify the app still compiles**

Run: `cd /c/Users/wrang/mobile-library && pnpm dev`

Expected: No compilation errors. Kill after confirming.

- [ ] **Step 4: Commit**

```bash
git add src/lib/hooks/use-books.ts
git commit -m "feat: add bulk deleteBooks function to use-books hook"
```

---

### Task 2: Add selection mode props to BookCard

**Files:**
- Modify: `src/components/book-card.tsx`
- Test: `__tests__/components/book-card.test.tsx`

- [ ] **Step 1: Write failing tests for checkbox rendering**

Add these tests to `__tests__/components/book-card.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BookCard } from "@/components/book-card";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("BookCard", () => {
  it("renders title and author", () => {
    render(<BookCard id="1" title="1984" author="George Orwell" available={2} total={2} />);
    expect(screen.getByText("1984")).toBeDefined();
    expect(screen.getByText("George Orwell")).toBeDefined();
  });

  it("shows availability badge", () => {
    render(<BookCard id="1" title="1984" author="George Orwell" available={1} total={2} />);
    expect(screen.getByText("1/2")).toBeDefined();
  });

  it("links to book detail page", () => {
    render(<BookCard id="abc-123" title="1984" author="George Orwell" available={2} total={2} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/catalogue/abc-123");
  });

  it("does not render checkbox when selectMode is false", () => {
    render(<BookCard id="1" title="1984" author="George Orwell" available={2} total={2} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("renders checkbox when selectMode is true", () => {
    render(
      <BookCard id="1" title="1984" author="George Orwell" available={2} total={2}
        selectMode selected={false} onSelect={() => {}} />
    );
    expect(screen.getByRole("checkbox")).toBeDefined();
  });

  it("renders checked checkbox when selected", () => {
    render(
      <BookCard id="1" title="1984" author="George Orwell" available={2} total={2}
        selectMode selected={true} onSelect={() => {}} />
    );
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("calls onSelect when checkbox is clicked", () => {
    const onSelect = vi.fn();
    render(
      <BookCard id="1" title="1984" author="George Orwell" available={2} total={2}
        selectMode selected={false} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("disables checkbox when selectDisabled is true", () => {
    render(
      <BookCard id="1" title="1984" author="George Orwell" available={0} total={2}
        selectMode selected={false} onSelect={() => {}} selectDisabled />
    );
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /c/Users/wrang/mobile-library && pnpm test -- __tests__/components/book-card.test.tsx`

Expected: New tests fail (props don't exist yet). Existing tests pass.

- [ ] **Step 3: Implement selection mode in BookCard**

Replace the entire contents of `src/components/book-card.tsx` with:

```tsx
import Link from "next/link";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  available: number;
  total: number;
  selectMode?: boolean;
  selected?: boolean;
  selectDisabled?: boolean;
  onSelect?: () => void;
}

export function BookCard({ id, title, author, available, total, selectMode, selected, selectDisabled, onSelect }: BookCardProps) {
  const badgeColor = available === 0 ? "bg-red-500" : available < total ? "bg-amber-500 text-black" : "bg-emerald-500";

  const content = (
    <div className="flex items-center gap-3">
      {selectMode && (
        <input
          type="checkbox"
          checked={selected ?? false}
          disabled={selectDisabled}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 disabled:opacity-30"
        />
      )}
      <div className="flex-1 flex justify-between items-center">
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-slate-500 text-sm">{author}</div>
        </div>
        <span className={`${badgeColor} text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap`}>
          {available}/{total}
        </span>
      </div>
    </div>
  );

  if (selectMode) {
    return (
      <div
        onClick={selectDisabled ? undefined : onSelect}
        className={`bg-slate-900 border rounded-xl p-3 ${
          selectDisabled ? "opacity-50 cursor-not-allowed border-slate-800" : "cursor-pointer hover:border-slate-700 border-slate-800"
        } ${selected ? "border-blue-500" : ""}`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link href={`/catalogue/${id}`} className="block bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700">
      {content}
    </Link>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /c/Users/wrang/mobile-library && pnpm test -- __tests__/components/book-card.test.tsx`

Expected: All 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/book-card.tsx __tests__/components/book-card.test.tsx
git commit -m "feat: add selection mode to BookCard with checkbox and disabled state"
```

---

### Task 3: Add select mode, selection state, and delete actions to catalogue page

**Files:**
- Modify: `src/app/(authenticated)/catalogue/page.tsx`

- [ ] **Step 1: Update the hook destructuring and add state**

At the top of `CataloguePage`, change:

```ts
const { books, addBook } = useBooks();
```

to:

```ts
const { books, addBook, deleteBooks } = useBooks();
```

Add these state variables after the existing state declarations (after line 21):

```ts
const [selectMode, setSelectMode] = useState(false);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [showDeleteSelected, setShowDeleteSelected] = useState(false);
const [showDeleteAll, setShowDeleteAll] = useState(false);
const [deleting, setDeleting] = useState(false);
```

- [ ] **Step 2: Add helper values and handlers**

Add after the `availabilityMap` useMemo (after line 33):

```ts
const deletableBooks = useMemo(
  () => filtered.filter((b) => (b.total_copies - (availabilityMap[b.id] || 0)) === b.total_copies),
  [filtered, availabilityMap]
);

const deletableIds = useMemo(() => new Set(deletableBooks.map((b) => b.id)), [deletableBooks]);

const selectedCount = selectedIds.size;

function toggleSelect(id: string) {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

function exitSelectMode() {
  setSelectMode(false);
  setSelectedIds(new Set());
}

async function handleDeleteSelected() {
  setDeleting(true);
  await deleteBooks([...selectedIds]);
  setDeleting(false);
  setShowDeleteSelected(false);
  setSelectedIds(new Set());
}

async function handleDeleteAll() {
  setDeleting(true);
  await deleteBooks(deletableBooks.map((b) => b.id));
  setDeleting(false);
  setShowDeleteAll(false);
  exitSelectMode();
}
```

- [ ] **Step 3: Update the header buttons**

Replace the header `<div>` (the one with "flex justify-between items-center") with:

```tsx
<div className="flex justify-between items-center">
  <h1 className="text-xl font-bold">Catalogue</h1>
  {isAdmin && (
    <div className="flex gap-2">
      {selectMode ? (
        <button
          onClick={exitSelectMode}
          className="text-sm border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-800"
        >
          Cancel
        </button>
      ) : (
        <>
          <button
            onClick={() => setSelectMode(true)}
            className="text-sm border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-800"
          >
            Select
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700"
          >
            + Add Book
          </button>
        </>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 4: Update BookCard rendering to pass selection props**

Replace the book list rendering block (the `filtered.map`) with:

```tsx
{filtered.map((book) => {
  const avail = book.total_copies - (availabilityMap[book.id] || 0);
  return (
    <BookCard
      key={book.id}
      id={book.id}
      title={book.title}
      author={book.author}
      available={avail}
      total={book.total_copies}
      selectMode={selectMode}
      selected={selectedIds.has(book.id)}
      selectDisabled={!deletableIds.has(book.id)}
      onSelect={() => toggleSelect(book.id)}
    />
  );
})}
```

- [ ] **Step 5: Add sticky bottom action bar and confirmation dialogs**

Add this right before the closing `</div>` of the component (before the final `</div>`):

```tsx
{selectMode && (
  <div className="fixed bottom-16 left-0 right-0 bg-slate-900 border-t border-slate-800 p-3 flex justify-between items-center gap-2 z-40">
    <span className="text-sm text-slate-400">
      {selectedCount} selected
    </span>
    <div className="flex gap-2">
      <button
        onClick={() => setShowDeleteAll(true)}
        disabled={deletableBooks.length === 0}
        className="text-sm border border-red-800 text-red-400 rounded-lg px-3 py-1.5 hover:bg-red-900/30 disabled:opacity-30"
      >
        Delete All ({deletableBooks.length})
      </button>
      <button
        onClick={() => setShowDeleteSelected(true)}
        disabled={selectedCount === 0}
        className="text-sm bg-red-600 text-white rounded-lg px-3 py-1.5 hover:bg-red-700 disabled:opacity-30"
      >
        Delete Selected ({selectedCount})
      </button>
    </div>
  </div>
)}

<ConfirmDialog
  open={showDeleteSelected}
  title="Delete Selected Books"
  message={`Delete ${selectedCount} selected book${selectedCount === 1 ? "" : "s"}? This cannot be undone.`}
  confirmLabel={deleting ? "Deleting..." : "Delete"}
  onConfirm={handleDeleteSelected}
  onCancel={() => setShowDeleteSelected(false)}
/>

<ConfirmDialog
  open={showDeleteAll}
  title="Delete All Books"
  message={`Delete all ${deletableBooks.length} book${deletableBooks.length === 1 ? "" : "s"} without active checkouts? This cannot be undone.`}
  confirmLabel={deleting ? "Deleting..." : "Delete All"}
  onConfirm={handleDeleteAll}
  onCancel={() => setShowDeleteAll(false)}
/>
```

- [ ] **Step 6: Add missing import for ConfirmDialog**

Add to the imports at the top of the file:

```ts
import { ConfirmDialog } from "@/components/confirm-dialog";
```

- [ ] **Step 7: Verify compilation**

Run: `cd /c/Users/wrang/mobile-library && pnpm dev`

Expected: No compilation errors. Kill after confirming.

- [ ] **Step 8: Commit**

```bash
git add src/app/\(authenticated\)/catalogue/page.tsx
git commit -m "feat: add bulk delete with select mode and delete all on catalogue page"
```

---

### Task 4: Run full test suite and manual verification

- [ ] **Step 1: Run full test suite**

Run: `cd /c/Users/wrang/mobile-library && pnpm test`

Expected: All tests pass.

- [ ] **Step 2: Run lint**

Run: `cd /c/Users/wrang/mobile-library && pnpm lint`

Expected: No lint errors.

- [ ] **Step 3: Run build**

Run: `cd /c/Users/wrang/mobile-library && pnpm build`

Expected: Build succeeds.

- [ ] **Step 4: Manual verification in browser**

Start: `cd /c/Users/wrang/mobile-library && pnpm dev`

Verify:
1. Log in as admin
2. Go to catalogue page
3. "Select" button appears next to "+ Add Book"
4. Click "Select" — checkboxes appear on all book cards
5. Books with active checkouts have disabled (greyed-out) checkboxes
6. Click book cards to select/deselect them
7. Bottom bar shows "N selected", "Delete All (N)", "Delete Selected (N)"
8. "Delete Selected" is disabled when nothing selected
9. Both delete actions show confirmation dialog
10. "Cancel" button exits select mode and clears selection
11. Non-admin users do not see the Select button

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address any issues found during verification"
```
