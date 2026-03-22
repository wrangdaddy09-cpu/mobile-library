"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Book } from "@/lib/supabase/types";

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("title");
    if (!error && data) setBooks(data as Book[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  async function addBook(book: { title: string; author: string; total_copies?: number }) {
    const { data, error } = await supabase
      .from("books")
      .insert(book)
      .select()
      .single();
    if (!error && data) {
      const newBook = data as Book;
      setBooks((prev) => [...prev, newBook].sort((a, b) => a.title.localeCompare(b.title)));
    }
    return { data: data as Book | null, error };
  }

  async function updateBook(id: string, updates: Partial<Book>) {
    const { data, error } = await supabase
      .from("books")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      const updated = data as Book;
      setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    }
    return { data: data as Book | null, error };
  }

  async function deleteBook(id: string) {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (!error) {
      setBooks((prev) => prev.filter((b) => b.id !== id));
    }
    return { error };
  }

  return { books, loading, fetchBooks, addBook, updateBook, deleteBook };
}
