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
