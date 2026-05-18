import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { DriverSettlement, SettlementFormData } from './types';

interface Props {
  mode: 'create' | 'edit';
  initial?: DriverSettlement;
  onClose: () => void;
  onSubmit: (data: SettlementFormData) => Promise<void>;
}

const EMPTY_FORM: SettlementFormData = {
  trip_id: '',
  trip_date: '',
  driver_id: '',
  driver_name: '',
  vehicle_number: '',
  route: '',
  advance_amount: '',
  trip_expenses_total: '',
  notes: '',
  payment_reference: '',
  custom_field_1_label: '',
  custom_field_1_value: '',
  custom_field_2_label: '',
  custom_field_2_value: '',
  custom_field_3_label: '',
  custom_field_3_value: '',
};

export function GenerateSettlementModal({ mode, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<SettlementFormData>(EMPTY_FORM);
  const [customOpen, setCustomOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        trip_id: initial.trip_id,
        trip_date: initial.trip_date,
        driver_id: initial.driver_id,
        driver_name: initial.driver_name,
        vehicle_number: initial.vehicle_number ?? '',
        route: initial.route ?? '',
        advance_amount: initial.advance_amount,
        trip_expenses_total: initial.trip_expenses_total,
        notes: initial.notes ?? '',
        payment_reference: initial.payment_reference ?? '',
        custom_field_1_label: initial.custom_field_1_label ?? '',
        custom_field_1_value: initial.custom_field_1_value ?? '',
        custom_field_2_label: initial.custom_field_2_label ?? '',
        custom_field_2_value: initial.custom_field_2_value ?? '',
        custom_field_3_label: initial.custom_field_3_label ?? '',
        custom_field_3_value: initial.custom_field_3_value ?? '',
      });
    }
  }, [initial]);

  function set(field: keyof SettlementFormData, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const advance = Number(form.advance_amount) || 0;
  const expenses = Number(form.trip_expenses_total) || 0;
  const diff = advance - expenses;
  const hasAmounts = form.advance_amount !== '' && form.trip_expenses_total !== '';

  const canSubmit =
    form.trip_id.trim() !== '' &&
    form.driver_name.trim() !== '' &&
    form.trip_date !== '' &&
    form.advance_amount !== '' &&
    form.trip_expenses_total !== '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(form);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setSubmitting(false);
    }
  }

  function DiffPreview() {
    if (!hasAmounts) return null;
    if (diff > 0) {
      return (
        <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm font-semibold text-red-700">
          ₹{Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 })} Recoverable from Driver
        </div>
      );
    }
    if (diff < 0) {
      return (
        <div className="mt-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-sm font-semibold text-green-700">
          ₹{Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 })} Payable to Driver
        </div>
      );
    }
    return (
      <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-500">
        Fully Settled
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {mode === 'create' ? 'Generate Settlement' : 'Edit Settlement'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {mode === 'create' ? 'Create a new driver settlement record' : 'Update the settlement details'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {mode === 'edit' && (
            <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">Editing this settlement will reset approval status to Pending.</p>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}

          {/* Section A — Trip Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
              A. Trip Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Trip ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.trip_id}
                  onChange={(e) => set('trip_id', e.target.value)}
                  readOnly={mode === 'edit'}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${mode === 'edit' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="e.g. TR1038"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Trip Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.trip_date}
                  onChange={(e) => set('trip_date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Driver Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.driver_name}
                  onChange={(e) => set('driver_name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Driver ID</label>
                <input
                  type="text"
                  value={form.driver_id}
                  onChange={(e) => set('driver_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. DRV-001"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  value={form.vehicle_number}
                  onChange={(e) => set('vehicle_number', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. MH46CL4952"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Route</label>
                <input
                  type="text"
                  value={form.route}
                  onChange={(e) => set('route', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Mumbai → Nagpur"
                />
              </div>
            </div>
          </div>

          {/* Section B — Financial Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
              B. Financial Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Advance to Driver (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.advance_amount}
                  onChange={(e) => set('advance_amount', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Trip Expenses Total (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.trip_expenses_total}
                  onChange={(e) => set('trip_expenses_total', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
            <DiffPreview />
          </div>

          {/* Section C — Additional Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
              C. Additional Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Any additional remarks..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Reference</label>
                <input
                  type="text"
                  value={form.payment_reference}
                  onChange={(e) => set('payment_reference', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. UTR/Cheque number"
                />
              </div>
            </div>
          </div>

          {/* Section D — Custom Fields */}
          <div>
            <button
              type="button"
              onClick={() => setCustomOpen((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 w-full pb-2 border-b border-gray-100 hover:text-blue-600 transition-colors"
            >
              {customOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              D. Company-Specific Fields
            </button>
            {customOpen && (
              <div className="mt-4 space-y-3">
                {([1, 2, 3] as const).map((n) => (
                  <div key={n} className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={form[`custom_field_${n}_label`]}
                      onChange={(e) => set(`custom_field_${n}_label`, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Custom Field ${n} Label`}
                    />
                    <input
                      type="text"
                      value={form[`custom_field_${n}_value`]}
                      onChange={(e) => set(`custom_field_${n}_value`, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Custom Field ${n} Value`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : mode === 'create' ? 'Generate Settlement' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
