"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useBooks } from "@/lib/hooks/use-books";
import { useCheckouts } from "@/lib/hooks/use-checkouts";
import { useSchools } from "@/lib/hooks/use-schools";
import { useSettings } from "@/lib/hooks/use-settings";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CheckoutRow } from "@/components/checkout-row";
import { enrichOneBook } from "@/app/(authenticated)/settings/actions";

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { books, updateBook, deleteBook } = useBooks();
  const { checkouts, checkoutBook, returnBook } = useCheckouts({ bookId: id });
  const { schools } = useSchools();
  const { settings } = useSettings();

  const book = books.find((b) => b.id === id);
  const activeCheckouts = checkouts.filter((c) => !c.returned_at);
  const available = book ? book.total_copies - activeCheckouts.length : 0;

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCopies, setEditCopies] = useState("");
  const [editPublisher, setEditPublisher] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editGenres, setEditGenres] = useState("");
  const [editThemes, setEditThemes] = useState("");
  const [enrichingOne, setEnrichingOne] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [surnameInitial, setSurnameInitial] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [showReturnId, setShowReturnId] = useState<string | null>(null);

  const loanDays = settings?.loan_duration_days ?? 28;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + loanDays);

  function startEdit() {
    if (!book) return;
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditCopies(String(book.total_copies));
    setEditPublisher(book.publisher || "");
    setEditYear(book.year_published ? String(book.year_published) : "");
    setEditDescription(book.description || "");
    setEditGenres((book.genres || []).join(", "));
    setEditThemes((book.themes || []).join(", "));
    setEditing(true);
  }

  async function handleSaveEdit() {
    await updateBook(id, {
      title: editTitle.trim(),
      author: editAuthor.trim(),
      total_copies: parseInt(editCopies) || 1,
      publisher: editPublisher.trim() || null,
      year_published: parseInt(editYear) || null,
      description: editDescription.trim() || null,
      genres: editGenres.split(",").map((g) => g.trim()).filter(Boolean),
      themes: editThemes.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setEditing(false);
  }

  async function handleDelete() {
    await deleteBook(id);
    router.push("/catalogue");
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setCheckingOut(true);
    await checkoutBook({
      book_id: id,
      borrower_first_name: firstName.trim(),
      borrower_surname_initial: surnameInitial.trim().toUpperCase(),
      school_id: schoolId,
      due_at: dueDate.toISOString(),
    });
    setCheckingOut(false);
    setFirstName("");
    setSurnameInitial("");
    setSchoolId("");
    setShowCheckout(false);
  }

  async function handleReturn() {
    if (showReturnId) {
      await returnBook(showReturnId);
      setShowReturnId(null);
    }
  }

  if (!book) {
    return <p className="text-slate-500 text-center py-8">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-blue-400 text-sm">&larr; Back</button>

      {!editing ? (
        <div className="space-y-2">
          <h1 className="text-xl font-bold">{book.title}</h1>
          <p className="text-slate-400">{book.author}</p>
          {book.publisher && book.publisher.toLowerCase() !== "unknown" && <p className="text-slate-500 text-sm">Publisher: {book.publisher}</p>}
          {book.year_published && <p className="text-slate-500 text-sm">Year: {book.year_published}</p>}
          {book.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {book.genres.map((g) => (
                <span key={g} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{g}</span>
              ))}
            </div>
          )}
          {book.themes?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {book.themes.map((t) => (
                <span key={t} className="bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
          {book.description && <p className="text-slate-400 text-sm">{book.description}</p>}
          {(!book.ai_enriched || !book.description) && (
            <div className="flex items-center gap-2">
              <p className="text-amber-400 text-xs">
                {!book.ai_enriched ? "Metadata not yet enriched by AI" : "Missing some AI metadata"}
              </p>
              <button
                disabled={enrichingOne}
                onClick={async () => {
                  setEnrichingOne(true);
                  await enrichOneBook(id);
                  window.location.reload();
                }}
                className="text-xs text-blue-400 hover:text-blue-300 underline disabled:opacity-50"
              >
                {enrichingOne ? "Enriching..." : "Enrich with AI"}
              </button>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={startEdit} className="text-sm border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-800">
              Edit
            </button>
            <button
              onClick={() => setShowDelete(true)}
              disabled={activeCheckouts.length > 0}
              className="text-sm border border-red-800 text-red-400 rounded-lg px-3 py-1.5 hover:bg-red-900/30 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Title</label>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Author</label>
            <input value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Copies</label>
              <input type="number" value={editCopies} onChange={(e) => setEditCopies(e.target.value)} min="1" className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Year Published</label>
              <input type="number" value={editYear} onChange={(e) => setEditYear(e.target.value)} className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Publisher</label>
            <input value={editPublisher} onChange={(e) => setEditPublisher(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Description</label>
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Genres (comma separated)</label>
            <input value={editGenres} onChange={(e) => setEditGenres(e.target.value)} placeholder="e.g. Fiction, Adventure" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Themes (comma separated)</label>
            <input value={editThemes} onChange={(e) => setEditThemes(e.target.value)} placeholder="e.g. Friendship, Coming of age" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">Save</button>
            <button onClick={() => setEditing(false)} className="border border-slate-700 rounded-lg px-4 py-2 hover:bg-slate-800">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">
            {available}/{book.total_copies} available
          </span>
          {available > 0 && (
            <button
              onClick={() => setShowCheckout(!showCheckout)}
              className="bg-blue-600 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-blue-700"
            >
              Check Out
            </button>
          )}
        </div>
      </div>

      {showCheckout && (
        <form onSubmit={handleCheckout} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold">Check Out</h3>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            value={surnameInitial}
            onChange={(e) => setSurnameInitial(e.target.value.slice(0, 1))}
            placeholder="Surname initial"
            required
            maxLength={1}
            className="w-16 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select school...</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <p className="text-slate-500 text-sm">Due: {dueDate.toLocaleDateString()}</p>
          <button type="submit" disabled={checkingOut} className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
            {checkingOut ? "Processing..." : "Confirm Checkout"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Checkout History</h2>
        {checkouts.length === 0 && (
          <p className="text-slate-500 text-sm">No checkout history.</p>
        )}
        {checkouts.map((c) => (
          <CheckoutRow
            key={c.id}
            bookTitle={book.title}
            borrowerName={c.borrower_first_name}
            borrowerInitial={c.borrower_surname_initial}
            schoolName={c.schools?.name ?? "Unknown"}
            dueAt={c.due_at}
            returnedAt={c.returned_at}
            onReturn={!c.returned_at ? () => setShowReturnId(c.id) : undefined}
          />
        ))}
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Book"
        message={`Delete "${book.title}" and all its checkout history? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      <ConfirmDialog
        open={!!showReturnId}
        title="Return Book"
        message="Mark this book as returned?"
        confirmLabel="Return"
        onConfirm={handleReturn}
        onCancel={() => setShowReturnId(null)}
      />
    </div>
  );
}
