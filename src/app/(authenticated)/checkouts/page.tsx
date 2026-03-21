"use client";

import { useState } from "react";
import { useCheckouts } from "@/lib/hooks/use-checkouts";
import { CheckoutRow } from "@/components/checkout-row";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function CheckoutsPage() {
  const { checkouts: activeCheckouts, returnBook: returnActive } = useCheckouts({ activeOnly: true });
  const { checkouts: allCheckouts } = useCheckouts();
  const [showHistory, setShowHistory] = useState(false);
  const [showReturnId, setShowReturnId] = useState<string | null>(null);

  const displayCheckouts = showHistory
    ? allCheckouts.filter((c) => c.returned_at)
    : activeCheckouts;

  async function handleReturn() {
    if (showReturnId) {
      await returnActive(showReturnId);
      setShowReturnId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Checkouts</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setShowHistory(false)}
          className={`text-sm rounded-lg px-3 py-1.5 ${!showHistory ? "bg-blue-600 text-white" : "border border-slate-700 text-slate-400 hover:bg-slate-800"}`}
        >
          Active
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className={`text-sm rounded-lg px-3 py-1.5 ${showHistory ? "bg-blue-600 text-white" : "border border-slate-700 text-slate-400 hover:bg-slate-800"}`}
        >
          History
        </button>
      </div>

      <div className="space-y-2">
        {displayCheckouts.map((c) => (
          <CheckoutRow
            key={c.id}
            bookTitle={c.books?.title ?? "Unknown"}
            borrowerName={c.borrower_first_name}
            borrowerInitial={c.borrower_surname_initial}
            schoolName={c.schools?.name ?? "Unknown"}
            dueAt={c.due_at}
            returnedAt={c.returned_at}
            onReturn={!c.returned_at ? () => setShowReturnId(c.id) : undefined}
          />
        ))}
        {displayCheckouts.length === 0 && (
          <p className="text-slate-500 text-center py-8">
            {showHistory ? "No returned books yet." : "No active checkouts."}
          </p>
        )}
      </div>

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
