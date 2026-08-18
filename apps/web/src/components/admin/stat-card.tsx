interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  trend?: string;
  accent?: 'blue' | 'green' | 'purple' | 'orange' | 'slate';
}

const accents = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  green: 'border-green-200 bg-green-50 text-green-700',
  purple: 'border-purple-200 bg-purple-50 text-purple-700',
  orange: 'border-orange-200 bg-orange-50 text-orange-700',
  slate: 'border-slate-200 bg-white text-slate-900',
};

export function StatCard({ label, value, hint, trend, accent = 'slate' }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${accents[accent]}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs opacity-60">{hint}</div>}
      {trend && <div className="mt-2 text-xs font-medium">{trend}</div>}
    </div>
  );
}
