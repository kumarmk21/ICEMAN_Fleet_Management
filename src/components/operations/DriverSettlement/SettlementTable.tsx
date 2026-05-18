import { useState } from 'react';
import { Eye, CreditCard as Edit, CheckCircle, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DriverSettlement } from './types';
import { formatCurrency, formatDate } from './utils';

interface Props {
  settlements: DriverSettlement[];
  onView: (s: DriverSettlement) => void;
  onEdit: (s: DriverSettlement) => void;
  onApprove: (s: DriverSettlement) => void;
  onMarkPaid: (s: DriverSettlement) => void;
}

const PAGE_SIZE = 10;

function TypeBadge({ type }: { type: DriverSettlement['settlement_type'] }) {
  if (type === 'Payable') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Payable</span>;
  if (type === 'Recoverable') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Recoverable</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Settled</span>;
}

function StatusBadge({ status }: { status: DriverSettlement['status'] }) {
  const map: Record<DriverSettlement['status'], string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Approved: 'bg-blue-100 text-blue-700',
    Paid: 'bg-green-100 text-green-700',
    Cancelled: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

export function SettlementTable({ settlements, onView, onEdit, onApprove, onMarkPaid }: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(settlements.length / PAGE_SIZE));
  const pageSettlements = settlements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function rowBg(s: DriverSettlement) {
    if (s.settlement_type === 'Recoverable') return 'bg-red-50/40 hover:bg-red-50/70';
    if (s.settlement_type === 'Payable') return 'bg-green-50/40 hover:bg-green-50/70';
    return 'hover:bg-gray-50';
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trip ID</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trip Date</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Driver</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Route</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Advance</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expenses</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Difference</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageSettlements.map((s) => (
              <tr key={s.id} className={`transition-colors ${rowBg(s)}`}>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onView(s)}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    {s.trip_id}
                  </button>
                </td>
                <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{formatDate(s.trip_date)}</td>
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{s.driver_name}</div>
                  {s.driver_id && <div className="text-xs text-gray-400 mt-0.5">{s.driver_id}</div>}
                </td>
                <td className="py-3 px-4 text-gray-600">{s.vehicle_number || '—'}</td>
                <td className="py-3 px-4 text-gray-600 max-w-[140px] truncate">{s.route || '—'}</td>
                <td className="py-3 px-4 text-right font-medium text-blue-700">{formatCurrency(s.advance_amount)}</td>
                <td className="py-3 px-4 text-right font-medium text-amber-700">{formatCurrency(s.trip_expenses_total)}</td>
                <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(Math.abs(s.difference_amount))}</td>
                <td className="py-3 px-4 text-center"><TypeBadge type={s.settlement_type} /></td>
                <td className="py-3 px-4 text-center"><StatusBadge status={s.status} /></td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onView(s)}
                      title="View"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(s)}
                      title="Edit"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {(s.status === 'Pending') && (
                      <button
                        onClick={() => onApprove(s)}
                        title="Approve"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {(s.status === 'Approved') && (
                      <button
                        onClick={() => onMarkPaid(s)}
                        title="Mark as Paid"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
        <p className="text-sm text-gray-500">
          Showing {settlements.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, settlements.length)} of {settlements.length} records
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
