import { useState, useEffect } from 'react';
import { X, Save, Upload, Loader2, Fuel, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';

interface Trip {
  trip_id: string;
  trip_number: string;
  vehicles?: { vehicle_number: string } | null;
  routes?: { origin_city: string; destination_city: string } | null;
}

interface ExpenseHead {
  expense_head_id: string;
  expense_head_name: string;
  category: string | null;
}

interface TripExpense {
  trip_expense_id: string;
  trip_id: string;
  expense_date: string;
  expense_head_id: string;
  vendor_id: string | null;
  description: string | null;
  amount: number;
  quantity: number | null;
  unit: string | null;
  unit_rate: number | null;
  bill_number: string | null;
  attachment_url: string | null;
  rate_per_litre: number | null;
  odometer_reading: number | null;
  toll_plaza_name: string | null;
  approval_status: string;
}

interface Vendor {
  vendor_id: string;
  vendor_name: string;
}

interface FormData {
  trip_id: string;
  expense_date: string;
  expense_head_id: string;
  vendor_id: string;
  amount: string;
  quantity: string;
  unit: string;
  unit_rate: string;
  bill_number: string;
  description: string;
  rate_per_litre: string;
  odometer_reading: string;
  toll_plaza_name: string;
}

interface Props {
  expense: TripExpense | null;
  trips: Trip[];
  expenseHeads: ExpenseHead[];
  preselectedTripId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ExpenseFormModal({ expense, trips, expenseHeads, preselectedTripId, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState(expense?.attachment_url || '');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [form, setForm] = useState<FormData>({
    trip_id: expense?.trip_id || preselectedTripId || '',
    expense_date: expense?.expense_date || new Date().toISOString().slice(0, 10),
    expense_head_id: expense?.expense_head_id || '',
    vendor_id: expense?.vendor_id || '',
    amount: expense?.amount?.toString() || '',
    quantity: expense?.quantity?.toString() || '',
    unit: expense?.unit || '',
    unit_rate: expense?.unit_rate?.toString() || '',
    bill_number: expense?.bill_number || '',
    description: expense?.description || '',
    rate_per_litre: expense?.rate_per_litre?.toString() || '',
    odometer_reading: expense?.odometer_reading?.toString() || '',
    toll_plaza_name: expense?.toll_plaza_name || '',
  });

  useEffect(() => {
    supabase.from('vendors').select('vendor_id, vendor_name').order('vendor_name').then(({ data }) => {
      if (data) setVendors(data);
    });
  }, []);

  const selectedHead = expenseHeads.find(h => h.expense_head_id === form.expense_head_id);
  const headName = selectedHead?.expense_head_name?.toLowerCase() ?? '';
  const isFuel = headName.includes('fuel') || headName.includes('diesel') || headName.includes('petrol');
  const isToll = headName.includes('toll') || selectedHead?.category?.toLowerCase().includes('toll');

  function setField(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }

  useEffect(() => {
    if (isFuel && form.quantity && form.rate_per_litre) {
      const calc = (parseFloat(form.quantity) * parseFloat(form.rate_per_litre)).toFixed(2);
      if (!isNaN(parseFloat(calc))) setField('amount', calc);
    } else if (!isFuel && form.quantity && form.unit_rate) {
      const calc = (parseFloat(form.quantity) * parseFloat(form.unit_rate)).toFixed(2);
      if (!isNaN(parseFloat(calc))) setField('amount', calc);
    }
  }, [form.quantity, form.rate_per_litre, form.unit_rate, isFuel]);

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.trip_id) e.trip_id = 'Required';
    if (!form.expense_date) e.expense_date = 'Required';
    if (!form.expense_head_id) e.expense_head_id = 'Required';
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      e.amount = 'Enter a valid amount';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `trip-expenses/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('vehicle-documents').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('vehicle-documents').getPublicUrl(path);
      setAttachmentUrl(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        trip_id: form.trip_id,
        expense_date: form.expense_date,
        expense_head_id: form.expense_head_id,
        vendor_id: form.vendor_id || null,
        amount: parseFloat(form.amount),
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        unit: form.unit || null,
        unit_rate: form.unit_rate ? parseFloat(form.unit_rate) : null,
        bill_number: form.bill_number || null,
        description: form.description || null,
        rate_per_litre: form.rate_per_litre ? parseFloat(form.rate_per_litre) : null,
        odometer_reading: form.odometer_reading ? parseFloat(form.odometer_reading) : null,
        toll_plaza_name: form.toll_plaza_name || null,
        attachment_url: attachmentUrl || null,
      };

      if (expense) {
        const { error } = await supabase
          .from('trip_expenses')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('trip_expense_id', expense.trip_expense_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trip_expenses')
          .insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  const fc = (err?: string) =>
    `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${err ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`;

  const selectedTrip = trips.find(t => t.trip_id === form.trip_id);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {expense ? 'Edit Expense' : 'Add Trip Expense'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Fill in the details below and save</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Trip <span className="text-red-500">*</span>
              </label>
              <select value={form.trip_id} onChange={e => setField('trip_id', e.target.value)} className={fc(errors.trip_id)}>
                <option value="">Select a trip</option>
                {trips.map(t => (
                  <option key={t.trip_id} value={t.trip_id}>
                    {t.trip_number}{t.vehicles?.vehicle_number ? ` · ${t.vehicles.vehicle_number}` : ''}
                  </option>
                ))}
              </select>
              {errors.trip_id && <p className="text-xs text-red-500 mt-1">{errors.trip_id}</p>}
              {selectedTrip?.routes && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedTrip.routes.origin_city} → {selectedTrip.routes.destination_city}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input type="date" value={form.expense_date} onChange={e => setField('expense_date', e.target.value)} className={fc(errors.expense_date)} />
              {errors.expense_date && <p className="text-xs text-red-500 mt-1">{errors.expense_date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Expense Head <span className="text-red-500">*</span>
              </label>
              <select value={form.expense_head_id} onChange={e => setField('expense_head_id', e.target.value)} className={fc(errors.expense_head_id)}>
                <option value="">Select expense head</option>
                {expenseHeads.map(h => (
                  <option key={h.expense_head_id} value={h.expense_head_id}>{h.expense_head_name}</option>
                ))}
              </select>
              {errors.expense_head_id && <p className="text-xs text-red-500 mt-1">{errors.expense_head_id}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={form.amount} onChange={e => setField('amount', e.target.value)}
                className={fc(errors.amount)}
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
          </div>

          {isFuel && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Fuel Details</span>
                <span className="text-xs text-blue-500 ml-auto">Amount auto-calculated from Qty × Rate</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity (L)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={form.quantity} onChange={e => setField('quantity', e.target.value)} className={fc()} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rate / Litre (₹)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={form.rate_per_litre} onChange={e => setField('rate_per_litre', e.target.value)} className={fc()} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Odometer (km)</label>
                  <input type="number" min="0" placeholder="0" value={form.odometer_reading} onChange={e => setField('odometer_reading', e.target.value)} className={fc()} />
                </div>
              </div>
            </div>
          )}

          {isToll && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Toll Details</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Toll Plaza Name</label>
                <input type="text" placeholder="e.g. NH48 Khed Shivapur" value={form.toll_plaza_name} onChange={e => setField('toll_plaza_name', e.target.value)} className={fc()} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Vendor</label>
              <select value={form.vendor_id} onChange={e => setField('vendor_id', e.target.value)} className={fc()}>
                <option value="">No vendor</option>
                {vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Bill / Invoice No.</label>
              <input type="text" placeholder="e.g. INV-20240001" value={form.bill_number} onChange={e => setField('bill_number', e.target.value)} className={fc()} />
            </div>
          </div>

          {!isFuel && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Quantity &amp; Rate</span>
                {form.quantity && form.unit_rate && (
                  <span className="text-xs text-blue-600 font-medium">
                    Amount = {parseFloat(form.quantity || '0')} × ₹{parseFloat(form.unit_rate || '0')} = ₹{(parseFloat(form.quantity) * parseFloat(form.unit_rate)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input type="number" min="0" step="0.01" placeholder="0" value={form.quantity} onChange={e => setField('quantity', e.target.value)} className={fc()} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <input type="text" placeholder="e.g. Nos, Kg, Hrs" value={form.unit} onChange={e => setField('unit', e.target.value)} className={fc()} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit Rate (₹)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={form.unit_rate} onChange={e => setField('unit_rate', e.target.value)} className={fc()} />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Description / Remarks</label>
            <textarea rows={2} placeholder="Optional notes..." value={form.description} onChange={e => setField('description', e.target.value)} className={`${fc()} resize-none`} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Receipt / Attachment</label>
            <div className="flex items-center gap-3 flex-wrap">
              <label className={`flex items-center gap-2 px-4 py-2 text-sm border-2 border-dashed rounded-lg cursor-pointer transition-all ${uploading ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-700'}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Upload File'}
                <input type="file" accept="image/*,.pdf" disabled={uploading} onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} className="hidden" />
              </label>
              {attachmentUrl && (
                <div className="flex items-center gap-2">
                  <a href={attachmentUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                    View Attachment
                  </a>
                  <button onClick={() => setAttachmentUrl('')} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : expense ? 'Update Expense' : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}
