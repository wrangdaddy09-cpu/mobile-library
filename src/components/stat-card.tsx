interface StatCardProps {
  label: string;
  value: number;
  color: "blue" | "green" | "yellow" | "red";
}

const colorMap = {
  blue: "text-blue-400",
  green: "text-emerald-400",
  yellow: "text-amber-400",
  red: "text-red-400",
};

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
      <div className={`text-3xl font-bold ${colorMap[color]}`}>{value}</div>
      <div className="text-slate-500 text-sm mt-1">{label}</div>
    </div>
  );
}
