"use client";

import { useState, useMemo } from "react";
import { useBooks } from "@/lib/hooks/use-books";
import { useCheckouts } from "@/lib/hooks/use-checkouts";
import { searchBooks } from "@/lib/search";
import { BookCard } from "@/components/book-card";
import { SearchInput } from "@/components/search-input";

export default function CataloguePage() {
  const { books, addBook } = useBooks();
  const { checkouts } = useCheckouts({ activeOnly: true });
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCopies, setNewCopies] = useState("1");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => searchBooks(books, query), [books, query]);

  const availabilityMap = useMemo(() => {
    const map: Record<string, number> = {};
    checkouts.forEach((c) => {
      if (!c.returned_at) {
        map[c.book_id] = (map[c.book_id] || 0) + 1;
      }
    });
    return map;
  }, [checkouts]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAdding(true);
    const { data, error } = await addBook({
      title: newTitle.trim(),
      author: newAuthor.trim(),
      total_copies: parseInt(newCopies) || 1,
    });
    setAdding(false);
    if (error) {
      setAddError(error.message);
      return;
    }
    // Trigger AI enrichment (non-blocking)
    if (data) {
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enrich-book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ book_id: data.id }),
      }).catch(() => {});
    }
    setNewTitle("");
    setNewAuthor("");
    setNewCopies("1");
    setShowAdd(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Catalogue</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700"
        >
          + Add Book
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          {addError && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-2 text-sm">{addError}</div>
          )}
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Book title"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="Author"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="number"
            value={newCopies}
            onChange={(e) => setNewCopies(e.target.value)}
            min="1"
            placeholder="Copies"
            className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" disabled={adding} className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
            {adding ? "Adding..." : "Add Book"}
          </button>
        </form>
      )}

      <SearchInput value={query} onChange={setQuery} placeholder="Search by title, author, genre, theme..." />

      <div className="space-y-2">
        {filtered.map((book) => (
          <BookCard
            key={book.id}
            id={book.id}
            title={book.title}
            author={book.author}
            available={book.total_copies - (availabilityMap[book.id] || 0)}
            total={book.total_copies}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-slate-500 text-center py-8">
            {query ? "No books match your search." : "No books in the catalogue yet."}
          </p>
        )}
      </div>
    </div>
  );
}
