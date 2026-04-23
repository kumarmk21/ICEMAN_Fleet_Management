import { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash2, IndianRupee, Truck, MapPin, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Trip, ExpenseHead } from '../../pages/TripExpensesList';

interface Vendor {
  vendor_id: string;
  vendor_name: string;
}

interface ExpenseLine {
  id: string; // local key
  expense_head_id: string;
  vendor_id: string;
  description: string;
  quantity: string;
  unit: string;
  unit_rate: string;
  amount: string;
  bill_number: string;
}

function emptyLine(): ExpenseLine {
  return {
    id: crypto.randomUUID(),
    expense_head_id: '',
    vendor_id: '',
    description: '',
    quantity: '',
    unit: '',
    unit_rate: '',
    amount: '',
    bill_number: '',
  };
}

interface Props {
  trip: Trip;
  expenseHeads: ExpenseHead[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ExpenseFormModal({ trip, expenseHeads, onClose, onSaved }: Props) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [lines, setLines] = useState<ExpenseLine[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('vendors').select('vendor_id, vendor_name').order('vendor_name').then(({ data }) => {
      if (data) setVendors(data);
    });
  }, []);

  function updateLine(id: string, field: keyof ExpenseLine, value: string) {
    setLines(prev => prev.map(line => {
      if (line.id !== id) return line;
      const updated = { ...line, [field]: value };

      // Auto-calculate amount when qty or unit_rate changes
      if (field === 'quantity' || field === 'unit_rate') {
        const qty = parseFloat(field === 'quantity' ? value : updated.quantity);
        const rate = parseFloat(field === 'unit_rate' ? value : updated.unit_rate);
        if (!isNaN(qty) && !isNaN(rate) && qty > 0 && rate > 0) {
          updated.amount = (qty * rate).toFixed(2);
        }
      }
      return updated;
    }));

    // Clear error for this field
    const key = `${id}_${field}`;
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  function addLine() {
    setLines(prev => [...prev, emptyLine()]);
  }

  function removeLine(id: string) {
    if (lines.length === 1) return;
    setLines(prev => prev.filter(l => l.id !== id));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    lines.forEach(line => {
      if (!line.expense_head_id) e[`${line.id}_expense_head_id`] = 'Required';
      const amt = parseFloat(line.amount);
      if (!line.amount || isNaN(amt) || amt <= 0) e[`${line.id}_amount`] = 'Required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      for (const line of lines) {
        // Get next ref number from DB function
        const { data: refData } = await supabase.rpc('generate_expense_ref_no');

        const payload = {
          expense_ref_no: refData,
          trip_id: trip.trip_id,
          expense_head_id: line.expense_head_id,
          vendor_id: line.vendor_id || null,
          description: line.description || null,
          quantity: line.quantity ? parseFloat(line.quantity) : null,
          unit: line.unit || null,
          unit_rate: line.unit_rate ? parseFloat(line.unit_rate) : null,
          amount: parseFloat(line.amount),
          bill_number: line.bill_number || null,
        };

        const { error } = await supabase.from('trip_expenses').insert(payload);
        if (error) throw error;
      }
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('Failed to save: ' + msg);
    } finally {
      setSaving(false);
    }
  }

  const runningTotal = lines.reduce((sum, line) => {
    const amt = parseFloat(line.amount);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const vehicleNo = trip.vehicles?.vehicle_number ?? trip.vehicle_number_text ?? '—';
  const route = trip.origin && trip.destination ? `${trip.origin} → ${trip.destination}` : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add Trip Expenses</h2>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-gray-500">
              <span className="flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                <Truck className="w-3 h-3" /> {trip.trip_number}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {vehicleNo}
              </span>
              {route && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {route}
                </span>
              )}
              {trip.customers?.customer_name && (
                <span className="text-gray-500">{trip.customers.customer_name}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 mb-2 px-1">
            <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expense Head <span className="text-red-500">*</span></div>
            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</div>
            <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</div>
            <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</div>
            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit Rate (₹)</div>
            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount (₹) <span className="text-red-500">*</span></div>
            <div className="col-span-1" />
          </div>

          {/* Expense lines */}
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={line.id} className="group">
                <div className="grid grid-cols-12 gap-2 items-start">
                  {/* Expense Head */}
                  <div className="col-span-3">
                    <select
                      value={line.expense_head_id}
                      onChange={e => updateLine(line.id, 'expense_head_id', e.target.value)}
                      className={`w-full px-2.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors[`${line.id}_expense_head_id`] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    >
                      <option value="">Select head</option>
                      {expenseHeads.map(h => (
                        <option key={h.expense_head_id} value={h.expense_head_id}>{h.expense_head_name}</option>
                      ))}
                    </select>
                    {errors[`${line.id}_expense_head_id`] && (
                      <p className="text-xs text-red-500 mt-0.5">{errors[`${line.id}_expense_head_id`]}</p>
                    )}
                  </div>

                  {/* Vendor */}
                  <div className="col-span-2">
                    <select
                      value={line.vendor_id}
                      onChange={e => updateLine(line.id, 'vendor_id', e.target.value)}
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <option value="">No vendor</option>
                      {vendors.map(v => (
                        <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Qty */}
                  <div className="col-span-1">
                    <input
                      type="number" min="0" step="0.01" placeholder="0"
                      value={line.quantity}
                      onChange={e => updateLine(line.id, 'quantity', e.target.value)}
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Unit */}
                  <div className="col-span-1">
                    <input
                      type="text" placeholder="Nos"
                      value={line.unit}
                      onChange={e => updateLine(line.id, 'unit', e.target.value)}
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Unit Rate */}
                  <div className="col-span-2">
                    <input
                      type="number" min="0" step="0.01" placeholder="0.00"
                      value={line.unit_rate}
                      onChange={e => updateLine(line.id, 'unit_rate', e.target.value)}
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Amount */}
                  <div className="col-span-2">
                    <input
                      type="number" min="0" step="0.01" placeholder="0.00"
                      value={line.amount}
                      onChange={e => updateLine(line.id, 'amount', e.target.value)}
                      className={`w-full px-2.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold transition-colors ${errors[`${line.id}_amount`] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                    {errors[`${line.id}_amount`] && (
                      <p className="text-xs text-red-500 mt-0.5">{errors[`${line.id}_amount`]}</p>
                    )}
                  </div>

                  {/* Remove */}
                  <div className="col-span-1 flex justify-center pt-1.5">
                    <button
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length === 1}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description + Bill No — expandable secondary row */}
                <div className="grid grid-cols-12 gap-2 mt-1.5 pl-0">
                  <div className="col-span-5">
                    <input
                      type="text" placeholder="Description / remarks (optional)"
                      value={line.description}
                      onChange={e => updateLine(line.id, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-600 bg-gray-50 placeholder-gray-400"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text" placeholder="Bill / Invoice No. (optional)"
                      value={line.bill_number}
                      onChange={e => updateLine(line.id, 'bill_number', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-600 bg-gray-50 placeholder-gray-400"
                    />
                  </div>
                  {idx < lines.length - 1 && (
                    <div className="col-span-12 mt-1 border-b border-dashed border-gray-200" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Line button */}
          <button
            onClick={addLine}
            className="mt-4 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Expense Head
          </button>
        </div>

        {/* Footer with running total */}
        <div className="border-t border-gray-200 bg-gray-50 rounded-b-2xl px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Running Total:</span>
                <span className="flex items-center gap-1 text-xl font-bold text-gray-900">
                  <IndianRupee className="w-4 h-4" />
                  {runningTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {lines.length} {lines.length === 1 ? 'expense line' : 'expense lines'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Expenses'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
