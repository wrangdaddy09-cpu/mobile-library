"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Checkout } from "@/lib/supabase/types";

export type CheckoutWithDetails = Checkout & {
  books: { title: string; author: string } | null;
  schools: { name: string } | null;
};

export function useCheckouts(options?: { bookId?: string; activeOnly?: boolean }) {
  const [checkouts, setCheckouts] = useState<CheckoutWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchCheckouts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("checkouts")
      .select("*, books(title, author), schools(name)")
      .order("due_at", { ascending: true });

    if (options?.bookId) {
      query = query.eq("book_id", options.bookId);
    }
    if (options?.activeOnly) {
      query = query.is("returned_at", null);
    }

    const { data, error } = await query;
    if (!error && data) setCheckouts(data as CheckoutWithDetails[]);
    setLoading(false);
  }, [supabase, options?.bookId, options?.activeOnly]);

  useEffect(() => {
    fetchCheckouts();
  }, [fetchCheckouts]);

  async function checkoutBook(checkout: {
    book_id: string;
    borrower_first_name: string;
    borrower_surname_initial: string;
    school_id: string;
    due_at: string;
  }) {
    const { data, error } = await supabase
      .from("checkouts")
      .insert(checkout as any)
      .select("*, books(title, author), schools(name)")
      .single();
    if (!error && data) {
      setCheckouts((prev) => [...prev, data as CheckoutWithDetails]);
    }
    return { data, error };
  }

  async function returnBook(checkoutId: string) {
    const { data, error } = await supabase
      .from("checkouts")
      .update({ returned_at: new Date().toISOString() } as any)
      .eq("id", checkoutId)
      .select("*, books(title, author), schools(name)")
      .single();
    if (!error && data) {
      setCheckouts((prev) =>
        prev.map((c) => (c.id === checkoutId ? (data as CheckoutWithDetails) : c))
      );
    }
    return { data, error };
  }

  return { checkouts, loading, fetchCheckouts, checkoutBook, returnBook };
}
