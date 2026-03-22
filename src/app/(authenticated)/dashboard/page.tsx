"use client";

import { useMemo } from "react";
import { useBooks } from "@/lib/hooks/use-books";
import { useCheckouts, type CheckoutWithDetails } from "@/lib/hooks/use-checkouts";
import { StatCard } from "@/components/stat-card";
import { CheckoutRow } from "@/components/checkout-row";
import { useIsAdmin } from "@/lib/admin-context";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const { books } = useBooks();
  const isAdmin = useIsAdmin();
  const { checkouts } = useCheckouts({ activeOnly: true });

  const stats = useMemo(() => {
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const dueSoon = checkouts.filter((c) => {
      const due = new Date(c.due_at);
      const diff = due.getTime() - now.getTime();
      return diff > 0 && diff <= threeDays;
    });
    const overdue = checkouts.filter((c) => new Date(c.due_at) < now);

    return {
      totalBooks: books.length,
      checkedOut: checkouts.length,
      dueSoon: dueSoon.length,
      overdue: overdue.length,
    };
  }, [books, checkouts]);

  const urgentCheckouts = useMemo(() => {
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return checkouts
      .filter((c) => {
        const due = new Date(c.due_at);
        return due.getTime() - now.getTime() <= threeDays;
      })
      .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
  }, [checkouts]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Books" value={stats.totalBooks} color="blue" />
        <StatCard label="Checked Out" value={stats.checkedOut} color="green" />
        <StatCard label="Due Soon" value={stats.dueSoon} color="yellow" />
        <StatCard label="Overdue" value={stats.overdue} color="red" />
      </div>

      {urgentCheckouts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Due Soon & Overdue</h2>
          {urgentCheckouts.map((c) => (
            <CheckoutRow
              key={c.id}
              bookId={c.book_id}
              bookTitle={c.books?.title ?? "Unknown"}
              borrowerName={c.borrower_first_name}
              borrowerInitial={c.borrower_surname_initial}
              schoolName={c.schools?.name ?? "Unknown"}
              dueAt={c.due_at}
              returnedAt={c.returned_at}
            />
          ))}
        </div>
      )}

      {urgentCheckouts.length === 0 && checkouts.length > 0 && (
        <p className="text-slate-500 text-center py-8">All books are on schedule.</p>
      )}

      {checkouts.length === 0 && (
        <p className="text-slate-500 text-center py-8">No books currently checked out.</p>
      )}

      {!isAdmin && (
        <div className="pt-4">
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="text-red-400 text-sm hover:text-red-300"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
