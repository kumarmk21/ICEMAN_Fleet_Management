import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Download, FileX, Loader2, Filter } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { DriverSettlement as DS, SettlementFormData } from './types';
import { calculateSummaryStats, exportToCsv } from './utils';
import { SettlementSummaryCards } from './SettlementSummaryCards';
import { SettlementTable } from './SettlementTable';
import { GenerateSettlementModal } from './GenerateSettlementModal';
import { SettlementDetailModal } from './SettlementDetailModal';
import { ApproveModal } from './ApproveModal';
import { MarkPaidModal } from './MarkPaidModal';

type Modal = 'generate' | 'edit' | 'detail' | 'approve' | 'markpaid' | null;

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export function DriverSettlement() {
  const [settlements, setSettlements] = useState<DS[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<DS | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  async function load() {
    setLoading(true);
    setFetchError('');
    const { data, error } = await supabase
      .from('driver_settlements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setFetchError(error.message);
    } else {
      setSettlements((data as DS[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = settlements.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.driver_name.toLowerCase().includes(q) && !s.trip_id.toLowerCase().includes(q) && !(s.route ?? '').toLowerCase().includes(q)) return false;
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    if (typeFilter !== 'All' && s.settlement_type !== typeFilter) return false;
    if (dateFrom && s.trip_date < dateFrom) return false;
    if (dateTo && s.trip_date > dateTo) return false;
    return true;
  });

  const stats = calculateSummaryStats(filtered);

  async function handleGenerate(data: SettlementFormData) {
    const payload = {
      trip_id: data.trip_id,
      trip_date: data.trip_date,
      driver_id: data.driver_id || '',
      driver_name: data.driver_name,
      vehicle_number: data.vehicle_number || null,
      route: data.route || null,
      advance_amount: Number(data.advance_amount),
      trip_expenses_total: Number(data.trip_expenses_total),
      notes: data.notes || null,
      payment_reference: data.payment_reference || null,
      custom_field_1_label: data.custom_field_1_label || null,
      custom_field_1_value: data.custom_field_1_value || null,
      custom_field_2_label: data.custom_field_2_label || null,
      custom_field_2_value: data.custom_field_2_value || null,
      custom_field_3_label: data.custom_field_3_label || null,
      custom_field_3_value: data.custom_field_3_value || null,
    };

    const { error } = await supabase.from('driver_settlements').insert(payload);
    if (error) throw new Error(error.message);
    setModal(null);
    showToast('Settlement generated successfully.');
    await load();
  }

  async function handleEdit(data: SettlementFormData) {
    if (!selected) return;
    const payload = {
      trip_date: data.trip_date,
      driver_id: data.driver_id || '',
      driver_name: data.driver_name,
      vehicle_number: data.vehicle_number || null,
      route: data.route || null,
      advance_amount: Number(data.advance_amount),
      trip_expenses_total: Number(data.trip_expenses_total),
      notes: data.notes || null,
      payment_reference: data.payment_reference || null,
      custom_field_1_label: data.custom_field_1_label || null,
      custom_field_1_value: data.custom_field_1_value || null,
      custom_field_2_label: data.custom_field_2_label || null,
      custom_field_2_value: data.custom_field_2_value || null,
      custom_field_3_label: data.custom_field_3_label || null,
      custom_field_3_value: data.custom_field_3_value || null,
      status: 'Pending' as const,
      approved_by: null,
      approved_at: null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('driver_settlements').update(payload).eq('id', selected.id);
    if (error) throw new Error(error.message);
    setModal(null);
    setSelected(null);
    showToast('Settlement updated. Status reset to Pending.');
    await load();
  }

  async function handleApprove(approvedBy: string) {
    if (!selected) return;
    const { error } = await supabase
      .from('driver_settlements')
      .update({ status: 'Approved', approved_by: approvedBy, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', selected.id);
    if (error) throw new Error(error.message);
    setModal(null);
    setSelected(null);
    showToast('Settlement approved successfully.');
    await load();
  }

  async function handleMarkPaid(paymentReference: string, paymentDate: string) {
    if (!selected) return;
    const { error } = await supabase
      .from('driver_settlements')
      .update({ status: 'Paid', payment_reference: paymentReference, payment_date: paymentDate, updated_at: new Date().toISOString() })
      .eq('id', selected.id);
    if (error) throw new Error(error.message);
    setModal(null);
    setSelected(null);
    showToast('Settlement marked as paid.');
    await load();
  }

  async function handleCancelSettlement(s: DS) {
    const { error } = await supabase
      .from('driver_settlements')
      .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
      .eq('id', s.id);
    if (error) {
      showToast(error.message, 'error');
    } else {
      setModal(null);
      setSelected(null);
      showToast('Settlement cancelled.');
      await load();
    }
  }

  function openView(s: DS) { setSelected(s); setModal('detail'); }
  function openEdit(s: DS) { setSelected(s); setModal('edit'); }
  function openApprove(s: DS) { setSelected(s); setModal('approve'); }
  function openMarkPaid(s: DS) { setSelected(s); setModal('markpaid'); }

  function closeModal() { setModal(null); setSelected(null); }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all duration-300 ${
              t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Settlement</h1>
            <p className="text-sm text-gray-500 mt-0.5">Operations &gt; Driver Settlement</p>
          </div>
          <button
            onClick={() => setModal('generate')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate Settlement
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search driver, trip ID, route..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {['All', 'Pending', 'Approved', 'Paid', 'Cancelled'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {['All', 'Payable', 'Recoverable', 'Settled'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>

            {/* Date Range */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="From date"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="To date"
            />

            {/* Export */}
            <button
              onClick={() => exportToCsv(filtered)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors ml-auto"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <SettlementSummaryCards stats={stats} />

        {/* Table / States */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : fetchError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 text-sm font-medium">{fetchError}</p>
            <button onClick={load} className="mt-3 text-sm text-red-600 underline">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200">
            <FileX className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No settlements found</p>
            <p className="text-sm text-gray-400 mt-1">
              {settlements.length === 0
                ? 'Click "Generate Settlement" to create the first record.'
                : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <SettlementTable
            settlements={filtered}
            onView={openView}
            onEdit={openEdit}
            onApprove={openApprove}
            onMarkPaid={openMarkPaid}
          />
        )}
      </div>

      {/* Modals */}
      {modal === 'generate' && (
        <GenerateSettlementModal mode="create" onClose={closeModal} onSubmit={handleGenerate} />
      )}
      {modal === 'edit' && selected && (
        <GenerateSettlementModal mode="edit" initial={selected} onClose={closeModal} onSubmit={handleEdit} />
      )}
      {modal === 'detail' && selected && (
        <SettlementDetailModal
          settlement={selected}
          onClose={closeModal}
          onEdit={() => { setModal('edit'); }}
          onApprove={() => { setModal('approve'); }}
          onMarkPaid={() => { setModal('markpaid'); }}
          onCancel={() => handleCancelSettlement(selected)}
        />
      )}
      {modal === 'approve' && selected && (
        <ApproveModal tripId={selected.trip_id} onClose={closeModal} onConfirm={handleApprove} />
      )}
      {modal === 'markpaid' && selected && (
        <MarkPaidModal tripId={selected.trip_id} onClose={closeModal} onConfirm={handleMarkPaid} />
      )}
    </div>
  );
}
