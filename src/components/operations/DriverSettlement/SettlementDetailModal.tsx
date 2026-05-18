import { X, CheckCircle, DollarSign, CreditCard as Edit, XCircle, Clock, Zap } from 'lucide-react';
import type { DriverSettlement } from './types';
import { formatCurrency, formatDate } from './utils';

interface Props {
  settlement: DriverSettlement;
  onClose: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onMarkPaid: () => void;
  onCancel: () => void;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value || '—'}</p>
    </div>
  );
}

export function SettlementDetailModal({ settlement: s, onClose, onEdit, onApprove, onMarkPaid, onCancel }: Props) {
  const diffAbs = Math.abs(s.difference_amount);

  const summaryStyle =
    s.settlement_type === 'Payable'
      ? { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'Payable to Driver' }
      : s.settlement_type === 'Recoverable'
      ? { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Recoverable from Driver' }
      : { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600', label: 'Fully Settled' };

  const steps: { label: string; done: boolean; icon: typeof Zap }[] = [
    { label: 'Generated', done: true, icon: Zap },
    { label: 'Approved', done: s.status === 'Approved' || s.status === 'Paid', icon: CheckCircle },
    { label: 'Paid', done: s.status === 'Paid', icon: DollarSign },
  ];

  const customFields = [
    { label: s.custom_field_1_label, value: s.custom_field_1_value },
    { label: s.custom_field_2_label, value: s.custom_field_2_value },
    { label: s.custom_field_3_label, value: s.custom_field_3_value },
  ].filter((f) => f.label);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Settlement Details</h2>
            <p className="text-xs text-gray-500 mt-0.5">Trip ID: {s.trip_id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Settlement Summary */}
          <div className={`rounded-xl border-2 ${summaryStyle.bg} p-5 text-center`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">{summaryStyle.label}</p>
            <p className={`text-4xl font-black ${summaryStyle.text}`}>
              {s.settlement_type === 'Settled' ? 'Fully Settled' : formatCurrency(diffAbs)}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                s.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                s.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                s.status === 'Paid' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {s.status}
              </span>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="flex items-center justify-center gap-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isCancelled = s.status === 'Cancelled';
              const active = step.done && !isCancelled;
              return (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                      active ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
                    }`}>
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-300'}`} />
                    </div>
                    <span className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>{step.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mb-5 ${steps[i + 1].done && !isCancelled ? 'bg-blue-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
            {s.status === 'Cancelled' && (
              <div className="flex items-center ml-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-red-300 bg-red-50">
                  <XCircle className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-xs font-medium text-red-500 ml-1">Cancelled</span>
              </div>
            )}
          </div>

          {/* Trip Info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Trip Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Trip ID" value={s.trip_id} />
              <Field label="Trip Date" value={formatDate(s.trip_date)} />
              <Field label="Driver Name" value={s.driver_name} />
              <Field label="Driver ID" value={s.driver_id} />
              <Field label="Vehicle Number" value={s.vehicle_number} />
              <Field label="Route" value={s.route} />
            </div>
          </div>

          {/* Financial */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Financial Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-center">
                <p className="text-xs text-gray-500">Advance</p>
                <p className="text-base font-bold text-blue-700">{formatCurrency(s.advance_amount)}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-center">
                <p className="text-xs text-gray-500">Trip Expenses</p>
                <p className="text-base font-bold text-amber-700">{formatCurrency(s.trip_expenses_total)}</p>
              </div>
              <div className={`p-3 rounded-xl text-center ${summaryStyle.bg}`}>
                <p className="text-xs text-gray-500">Difference</p>
                <p className={`text-base font-bold ${summaryStyle.text}`}>{formatCurrency(diffAbs)}</p>
              </div>
            </div>
          </div>

          {/* Additional */}
          {(s.notes || s.payment_reference || s.payment_date) && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Additional Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {s.notes && <div className="col-span-2"><Field label="Notes" value={s.notes} /></div>}
                {s.payment_reference && <Field label="Payment Reference" value={s.payment_reference} />}
                {s.payment_date && <Field label="Payment Date" value={formatDate(s.payment_date)} />}
              </div>
            </div>
          )}

          {/* Audit */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Audit Trail</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Generated By" value={s.generated_by} />
              <Field label="Generated At" value={s.generated_at ? new Date(s.generated_at).toLocaleString('en-IN') : undefined} />
              {s.approved_by && <Field label="Approved By" value={s.approved_by} />}
              {s.approved_at && <Field label="Approved At" value={new Date(s.approved_at).toLocaleString('en-IN')} />}
            </div>
          </div>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Company-Specific Fields</h3>
              <div className="grid grid-cols-2 gap-4">
                {customFields.map((f, i) => (
                  <Field key={i} label={f.label!} value={f.value} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex gap-2">
            {s.status !== 'Cancelled' && s.status !== 'Paid' && (
              <button
                onClick={onCancel}
                className="px-3 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Cancel Settlement
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
            {s.status === 'Pending' && (
              <button
                onClick={onApprove}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
            )}
            {s.status === 'Approved' && (
              <button
                onClick={onMarkPaid}
                className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" /> Mark as Paid
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
