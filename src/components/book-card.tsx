import Link from "next/link";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  available: number;
  total: number;
}

export function BookCard({ id, title, author, available, total }: BookCardProps) {
  const badgeColor = available === 0 ? "bg-red-500" : available < total ? "bg-amber-500 text-black" : "bg-emerald-500";

  return (
    <Link href={`/catalogue/${id}`} className="block bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-slate-500 text-sm">{author}</div>
        </div>
        <span className={`${badgeColor} text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap`}>
          {available}/{total}
        </span>
      </div>
    </Link>
  );
}
