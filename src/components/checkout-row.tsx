import Link from "next/link";

interface CheckoutRowProps {
  bookTitle: string;
  borrowerName: string;
  borrowerInitial: string;
  schoolName: string;
  dueAt: string;
  returnedAt: string | null;
  onReturn?: () => void;
  bookId?: string;
}

export function CheckoutRow({ bookTitle, borrowerName, borrowerInitial, schoolName, dueAt, returnedAt, onReturn, bookId }: CheckoutRowProps) {
  const now = new Date();
  const due = new Date(dueAt);
  const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let statusBadge: React.ReactNode = null;
  if (returnedAt) {
    statusBadge = <span className="text-xs text-slate-500">Returned</span>;
  } else if (daysUntilDue < 0) {
    statusBadge = <span className="text-xs font-semibold text-red-400">OVERDUE</span>;
  } else if (daysUntilDue <= 3) {
    statusBadge = <span className="text-xs font-semibold text-amber-400">DUE IN {daysUntilDue}d</span>;
  } else {
    statusBadge = <span className="text-xs text-slate-500">Due {due.toLocaleDateString()}</span>;
  }

  const content = (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{bookTitle}</div>
          <div className="text-slate-500 text-sm">{borrowerName} {borrowerInitial}. — {schoolName}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {statusBadge}
          {!returnedAt && onReturn && (
            <button onClick={onReturn} className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 hover:bg-slate-700">
              Return
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (bookId) {
    return <Link href={`/catalogue/${bookId}`}>{content}</Link>;
  }
  return content;
}
