import { useEffect, useState, useCallback } from 'react';
import { Download, Search, IndianRupee, Truck, ChevronDown, ChevronRight, Receipt, Plus, CheckCircle, Clock, XCircle, Trash2, LockKeyhole } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { downloadCSV } from '../lib/csv-utils';
import ExpenseFormModal from '../components/trip-expenses/ExpenseFormModal';

export interface Trip {
  trip_id: string;
  trip_number: string;
  trip_status: string | null;
  actual_end_datetime: string | null;
  origin: string | null;
  destination: string | null;
  vehicle_number_text: string | null;
  freight_revenue: number | null;
  trip_closure: string | null;
  trip_closed_by: string | null;
  vehicles: { vehicle_number: string } | null;
  customers: { customer_name: string } | null;
}

export interface TripExpense {
  trip_expense_id: string;
  expense_ref_no: string | null;
  trip_id: string;
  expense_head_id: string;
  vendor_id: string | null;
  description: string | null;
  amount: number;
  quantity: number | null;
  unit: string | null;
  unit_rate: number | null;
  bill_number: string | null;
  attachment_url: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  expense_heads: { expense_head_name: string; category: string | null } | null;
  vendors: { vendor_name: string } | null;
}

export interface ExpenseHead {
  expense_head_id: string;
  expense_head_name: string;
  category: string | null;
}

export function TripExpensesList() {
  const { isAdmin, isFleetManager } = useAuth();
  const canApprove = isAdmin || isFleetManager;

  const [trips, setTrips] = useState<Trip[]>([]);
  const [expensesByTrip, setExpensesByTrip] = useState<Record<string, TripExpense[]>>({});
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set());
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tripRes, expRes, headRes] = await Promise.all([
        supabase
          .from('trips')
          .select('trip_id, trip_number, trip_status, actual_end_datetime, origin, destination, vehicle_number_text, freight_revenue, trip_closure, trip_closed_by, vehicles(vehicle_number), customers(customer_name)')
          .not('actual_end_datetime', 'is', null)
          .order('actual_end_datetime', { ascending: false }),
        supabase
          .from('trip_expenses')
          .select('*, expense_heads(expense_head_name, category), vendors(vendor_name)')
          .order('created_at', { ascending: true }),
        supabase
          .from('expense_heads')
          .select('expense_head_id, expense_head_name, category')
          .order('expense_head_name'),
      ]);

      if (tripRes.error) console.error('Trips error:', tripRes.error);
      if (expRes.error) console.error('Expenses error:', expRes.error);
      if (headRes.error) console.error('Heads error:', headRes.error);

      const tripList = (tripRes.data ?? []) as Trip[];
      setTrips(tripList);

      const grouped: Record<string, TripExpense[]> = {};
      tripList.forEach(t => { grouped[t.trip_id] = []; });
      (expRes.data ?? []).forEach((e: TripExpense) => {
        if (grouped[e.trip_id]) grouped[e.trip_id].push(e);
        else grouped[e.trip_id] = [e];
      });
      setExpensesByTrip(grouped);

      if (headRes.data) setExpenseHeads(headRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredTrips = trips.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.trip_number.toLowerCase().includes(q) ||
      (t.vehicles?.vehicle_number ?? t.vehicle_number_text ?? '').toLowerCase().includes(q) ||
      (t.origin ?? '').toLowerCase().includes(q) ||
      (t.destination ?? '').toLowerCase().includes(q) ||
      (t.customers?.customer_name ?? '').toLowerCase().includes(q)
    );
  });

  const totalExpenses = Object.values(expensesByTrip).flat().reduce((s, e) => s + (e.amount || 0), 0);
  const totalTrips = trips.length;
  const tripsWithExpenses = trips.filter(t => (expensesByTrip[t.trip_id]?.length ?? 0) > 0).length;
  const pendingCount = Object.values(expensesByTrip).flat().filter(e => e.approval_status === 'pending').length;
  const finClosedCount = trips.filter(t => t.trip_status === 'Financially Closed').length;

  function toggleTrip(tripId: string) {
    setExpandedTrips(prev => {
      const next = new Set(prev);
      next.has(tripId) ? next.delete(tripId) : next.add(tripId);
      return next;
    });
  }

  async function handleDelete(expenseId: string) {
    if (!confirm('Delete this expense? This cannot be undone.')) return;
    await supabase.from('trip_expenses').delete().eq('trip_expense_id', expenseId);
    await loadData();
  }

  function handleExport() {
    const rows = Object.values(expensesByTrip).flat().map(e => ({
      'Ref No': e.expense_ref_no ?? '',
      'Expense Head': e.expense_heads?.expense_head_name ?? '',
      'Vendor': e.vendors?.vendor_name ?? '',
      'Qty': e.quantity ?? '',
      'Unit': e.unit ?? '',
      'Unit Rate': e.unit_rate ?? '',
      'Amount': e.amount,
      'Bill No': e.bill_number ?? '',
      'Description': e.description ?? '',
      'Status': e.approval_status,
    }));
    downloadCSV(rows, `trip-expenses-${new Date().toISOString().slice(0, 10)}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Record expenses for arrived trips</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<Truck className="w-5 h-5" />} label="Arrived Trips" value={String(totalTrips)} sub="eligible for expenses" color="bg-blue-50 text-blue-600" />
        <SummaryCard icon={<Receipt className="w-5 h-5" />} label="With Expenses" value={String(tripsWithExpenses)} sub={`${totalTrips - tripsWithExpenses} awaiting`} color="bg-slate-100 text-slate-600" />
        <SummaryCard icon={<LockKeyhole className="w-5 h-5" />} label="Fin. Closed" value={String(finClosedCount)} sub="financially closed" color="bg-green-50 text-green-600" />
        <SummaryCard icon={<IndianRupee className="w-5 h-5" />} label="Total Expenses" value={`₹${totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub="across all trips" color="bg-teal-50 text-teal-600" />
      </div>

      {/* Trip list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Arrived Trips ({filteredTrips.length})</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search trip, vehicle, route..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Truck className="w-14 h-14 text-gray-200 mb-4" />
            <p className="text-gray-500 font-semibold text-base">No arrived trips found</p>
            <p className="text-sm text-gray-400 mt-1">Trips appear here once Truck Arrival is recorded</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTrips.map(trip => {
              const expenses = expensesByTrip[trip.trip_id] ?? [];
              const tripTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
              const isOpen = expandedTrips.has(trip.trip_id);
              const vehicleNo = trip.vehicles?.vehicle_number ?? trip.vehicle_number_text ?? '—';
              const route = trip.origin && trip.destination ? `${trip.origin} → ${trip.destination}` : null;
              const isFinClosed = trip.trip_status === 'Financially Closed';

              return (
                <div key={trip.trip_id}>
                  {/* Trip row */}
                  <div className={`flex items-center gap-4 px-4 py-4 transition-colors ${isFinClosed ? 'bg-green-50/40 hover:bg-green-50/60' : 'hover:bg-gray-50/70'}`}>
                    {/* Expand toggle */}
                    <button
                      onClick={() => expenses.length > 0 && toggleTrip(trip.trip_id)}
                      className={`shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors ${expenses.length > 0 ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-200' : 'text-gray-200 cursor-default'}`}
                    >
                      {expenses.length > 0 ? (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <ChevronRight className="w-4 h-4 opacity-30" />}
                    </button>

                    {/* Trip info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{trip.trip_number}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{vehicleNo}</span>
                        {trip.customers?.customer_name && (
                          <span className="text-xs text-gray-500">{trip.customers.customer_name}</span>
                        )}
                        {isFinClosed ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                            <LockKeyhole className="w-3 h-3" /> Fin. Closed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            <Clock className="w-3 h-3" /> Open
                          </span>
                        )}
                      </div>
                      {route && <p className="text-xs text-gray-400 mt-0.5">{route}</p>}
                      {isFinClosed && trip.trip_closed_by && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Closed by <span className="font-semibold">{trip.trip_closed_by}</span>
                          {trip.trip_closure ? ` · ${new Date(trip.trip_closure).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                        </p>
                      )}
                    </div>

                    {/* Expense summary */}
                    <div className="text-right shrink-0 hidden sm:block">
                      {expenses.length > 0 ? (
                        <>
                          <p className="font-bold text-gray-900">₹{tripTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                          <p className="text-xs text-gray-400">{expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">No expenses yet</p>
                      )}
                    </div>

                    {/* Add Expense button — disabled when financially closed */}
                    {isFinClosed ? (
                      <div className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-green-700 bg-green-100 border border-green-200 rounded-lg cursor-not-allowed select-none">
                        <LockKeyhole className="w-4 h-4" />
                        <span className="hidden sm:inline">Fin. Closed</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedTrip(trip)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Expense</span>
                      </button>
                    )}
                  </div>

                  {/* Expenses sub-table */}
                  {isOpen && expenses.length > 0 && (
                    <div className="bg-gray-50/60 border-t border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100/80">
                            <th className="px-8 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref No</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Expense Head</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Vendor</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Qty × Rate</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {expenses.map(exp => (
                            <tr key={exp.trip_expense_id} className="hover:bg-blue-50/20 transition-colors">
                              <td className="px-8 py-2.5 font-mono text-xs text-gray-500">{exp.expense_ref_no ?? '—'}</td>
                              <td className="px-4 py-2.5">
                                <div className="font-medium text-gray-800 text-sm">{exp.expense_heads?.expense_head_name ?? '—'}</div>
                                {exp.description && <div className="text-xs text-gray-400 truncate max-w-xs">{exp.description}</div>}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-500 hidden md:table-cell">{exp.vendors?.vendor_name ?? '—'}</td>
                              <td className="px-4 py-2.5 text-right text-xs text-gray-500 hidden lg:table-cell">
                                {exp.quantity != null && exp.unit_rate != null
                                  ? `${exp.quantity} × ₹${exp.unit_rate}`
                                  : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                                ₹{exp.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <StatusBadge status={exp.approval_status} />
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center justify-end gap-1">
                                  {canApprove && exp.approval_status === 'pending' && (
                                    <>
                                      <ApproveBtn expenseId={exp.trip_expense_id} action="approve" onDone={loadData} />
                                      <ApproveBtn expenseId={exp.trip_expense_id} action="reject" onDone={loadData} />
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDelete(exp.trip_expense_id)}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100/60 border-t border-gray-200">
                            <td colSpan={4} className="px-8 py-2 text-xs font-semibold text-gray-600">Trip Total</td>
                            <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">
                              ₹{tripTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedTrip && (
        <ExpenseFormModal
          trip={selectedTrip}
          expenseHeads={expenseHeads}
          onClose={() => setSelectedTrip(null)}
          onSaved={() => { setSelectedTrip(null); loadData(); }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <CheckCircle className="w-3 h-3" /> Approved
    </span>
  );
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      <XCircle className="w-3 h-3" /> Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

function ApproveBtn({ expenseId, action, onDone }: { expenseId: string; action: 'approve' | 'reject'; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  async function handle() {
    setLoading(true);
    await supabase.from('trip_expenses').update({
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      approved_at: new Date().toISOString(),
    }).eq('trip_expense_id', expenseId);
    setLoading(false);
    onDone();
  }
  return (
    <button
      onClick={handle}
      disabled={loading}
      title={action === 'approve' ? 'Approve' : 'Reject'}
      className={`p-1 rounded transition-colors disabled:opacity-40 ${action === 'approve' ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
    >
      {action === 'approve' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
    </button>
  );
}

function SummaryCard({ icon, label, value, sub, color, highlight }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${highlight ? 'border-amber-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>{icon}</div>
      </div>
    </div>
  );
}
