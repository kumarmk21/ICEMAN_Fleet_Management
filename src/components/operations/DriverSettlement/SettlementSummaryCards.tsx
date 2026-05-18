import { FileText, TrendingDown, TrendingUp, Clock } from 'lucide-react';
import type { SummaryStats } from './types';
import { formatCurrency } from './utils';

interface Props {
  stats: SummaryStats;
}

export function SettlementSummaryCards({ stats }: Props) {
  const cards = [
    {
      label: 'Total Settlements',
      value: stats.totalSettlements.toString(),
      icon: FileText,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueCls: 'text-gray-900',
    },
    {
      label: 'Total Payable to Drivers',
      value: formatCurrency(stats.totalPayable),
      icon: TrendingDown,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueCls: 'text-green-700',
    },
    {
      label: 'Total Recoverable from Drivers',
      value: formatCurrency(stats.totalRecoverable),
      icon: TrendingUp,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      valueCls: 'text-red-700',
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals.toString(),
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      valueCls: 'text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4"
          >
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${card.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 truncate">{card.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${card.valueCls}`}>{card.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
