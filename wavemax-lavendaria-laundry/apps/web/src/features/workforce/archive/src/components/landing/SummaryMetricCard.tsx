// @ts-nocheck
import type { LucideIcon } from 'lucide-react';

interface SummaryMetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'teal' | 'amber' | 'red' | 'green' | 'slate';
}

export default function SummaryMetricCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'teal',
}: SummaryMetricCardProps) {
  const colorClasses = {
    teal: 'text-teal-600 bg-teal-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    green: 'text-green-600 bg-green-50',
    slate: 'text-slate-600 bg-slate-50',
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl font-bold text-gray-900">{value}</h3>
          {trend && (
            <span className={`text-[10px] font-bold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
