import type { Book } from "@/lib/supabase/types";

export function searchBooks(books: Book[], query: string): Book[] {
  if (!query.trim()) return books;

  const q = query.toLowerCase();
  return books.filter((book) => {
    const fields = [
      book.title,
      book.author,
      book.publisher,
      ...(book.genres || []),
      ...(book.themes || []),
    ];
    return fields.some((field) => field?.toLowerCase().includes(q));
  });
}
