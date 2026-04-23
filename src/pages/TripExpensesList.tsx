import { useEffect, useState, useCallback } from 'react';
import { Plus, Download, Filter, Search, ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, IndianRupee, AlertCircle, CreditCard as Edit2, Trash2, Paperclip, Truck, CalendarDays, BarChart3, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { downloadCSV } from '../lib/csv-utils';
import ExpenseFormModal from '../components/trip-expenses/ExpenseFormModal';

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
  bill_number: string | null;
  attachment_url: string | null;
  rate_per_litre: number | null;
  odometer_reading: number | null;
  toll_plaza_name: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  approval_remarks: string | null;
  created_at: string;
  expense_heads: { expense_head_name: string; category: string | null } | null;
  vendors: { vendor_name: string } | null;
  trips: {
    trip_number: string;
    vehicles: { vehicle_number: string } | null;
    routes: { origin_city: string; destination_city: string } | null;
  } | null;
}

interface Trip {
  trip_id: string;
  trip_number: string;
  trip_status: string | null;
  vehicles: { vehicle_number: string } | null;
  routes: { origin_city: string; destination_city: string } | null;
  freight_revenue: number | null;
  trip_closure: string | null;
}

interface ExpenseHead {
  expense_head_id: string;
  expense_head_name: string;
  category: string | null;
}

type TabType = 'all' | 'pending' | 'by-trip';
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export function TripExpensesList() {
  const { user, isAdmin, isFleetManager } = useAuth();
  const canApprove = isAdmin || isFleetManager;

  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterExpenseHead, setFilterExpenseHead] = useState('');
  const [filterTrip, setFilterTrip] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TripExpense | null>(null);
  const [preselectedTripId, setPreselectedTripId] = useState<string | undefined>();

  const [approvingExpense, setApprovingExpense] = useState<TripExpense | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, tripRes, headRes] = await Promise.all([
        supabase
          .from('trip_expenses')
          .select(`
            *,
            expense_heads(expense_head_name, category),
            vendors(vendor_name),
            trips(trip_number, vehicles(vehicle_number), routes(origin_city, destination_city))
          `)
          .order('expense_date', { ascending: false }),
        supabase
          .from('trips')
          .select('trip_id, trip_number, trip_status, trip_closure, vehicles(vehicle_number), routes(origin_city, destination_city), freight_revenue')
          .not('actual_end_datetime', 'is', null)
          .order('trip_number', { ascending: false }),
        supabase
          .from('expense_heads')
          .select('expense_head_id, expense_head_name, category')
          .order('expense_head_name'),
      ]);

      if (expRes.data) setExpenses(expRes.data as TripExpense[]);
      if (tripRes.data) setTrips(tripRes.data as Trip[]);
      if (headRes.data) setExpenseHeads(headRes.data);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredExpenses = expenses.filter(exp => {
    if (activeTab === 'pending' && exp.approval_status !== 'pending') return false;
    if (filterStatus !== 'all' && exp.approval_status !== filterStatus) return false;
    if (filterExpenseHead && exp.expense_head_id !== filterExpenseHead) return false;
    if (filterTrip && exp.trip_id !== filterTrip) return false;
    if (filterDateFrom && exp.expense_date < filterDateFrom) return false;
    if (filterDateTo && exp.expense_date > filterDateTo) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return !!(
        exp.trips?.trip_number?.toLowerCase().includes(q) ||
        exp.expense_heads?.expense_head_name?.toLowerCase().includes(q) ||
        exp.vendors?.vendor_name?.toLowerCase().includes(q) ||
        exp.bill_number?.toLowerCase().includes(q) ||
        exp.description?.toLowerCase().includes(q) ||
        exp.trips?.vehicles?.vehicle_number?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingCount = expenses.filter(e => e.approval_status === 'pending').length;
  const approvedAmount = expenses
    .filter(e => e.approval_status === 'approved')
    .reduce((s, e) => s + (e.amount || 0), 0);
  const now = new Date();
  const thisMonthAmount = expenses
    .filter(e => {
      const d = new Date(e.expense_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + (e.amount || 0), 0);

  async function handleApprovalConfirm() {
    if (!approvingExpense || !approvalAction) return;
    setApprovalLoading(true);
    try {
      await supabase.from('trip_expenses').update({
        approval_status: approvalAction === 'approve' ? 'approved' : 'rejected',
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        approval_remarks: approvalRemarks,
      }).eq('trip_expense_id', approvingExpense.trip_expense_id);
      await loadData();
      setApprovingExpense(null);
      setApprovalAction(null);
      setApprovalRemarks('');
    } finally {
      setApprovalLoading(false);
    }
  }

  async function handleDelete(expenseId: string) {
    if (!confirm('Delete this expense record? This cannot be undone.')) return;
    await supabase.from('trip_expenses').delete().eq('trip_expense_id', expenseId);
    setExpenses(prev => prev.filter(e => e.trip_expense_id !== expenseId));
  }

  function openAddModal(tripId?: string) {
    setEditingExpense(null);
    setPreselectedTripId(tripId);
    setShowModal(true);
  }

  function openEditModal(exp: TripExpense) {
    setEditingExpense(exp);
    setPreselectedTripId(undefined);
    setShowModal(true);
  }

  function handleExport() {
    const rows = filteredExpenses.map(e => ({
      'Trip Number': e.trips?.trip_number || '',
      'Vehicle': e.trips?.vehicles?.vehicle_number || '',
      'Route': e.trips?.routes ? `${e.trips.routes.origin_city} - ${e.trips.routes.destination_city}` : '',
      'Date': e.expense_date,
      'Expense Head': e.expense_heads?.expense_head_name || '',
      'Category': e.expense_heads?.category || '',
      'Amount (INR)': e.amount,
      'Quantity': e.quantity ?? '',
      'Unit': e.unit ?? '',
      'Rate/Litre': e.rate_per_litre ?? '',
      'Odometer': e.odometer_reading ?? '',
      'Toll Plaza': e.toll_plaza_name ?? '',
      'Vendor': e.vendors?.vendor_name || '',
      'Bill Number': e.bill_number || '',
      'Status': e.approval_status,
      'Description': e.description || '',
    }));
    downloadCSV(rows, `trip-expenses-${new Date().toISOString().slice(0, 10)}`);
  }

  function toggleTrip(tripId: string) {
    setExpandedTrips(prev => {
      const next = new Set(prev);
      if (next.has(tripId)) next.delete(tripId);
      else next.add(tripId);
      return next;
    });
  }

  function clearFilters() {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterExpenseHead('');
    setFilterStatus('all');
    setFilterTrip('');
    setSearchQuery('');
  }

  const hasActiveFilters = !!(filterDateFrom || filterDateTo || filterExpenseHead || filterStatus !== 'all' || filterTrip || searchQuery);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track, manage and approve all trip-related expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Expenses"
          value={`₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub={`${expenses.length} entries`}
          icon={<IndianRupee className="w-5 h-5" />}
          colorClass="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          title="Pending Approval"
          value={String(pendingCount)}
          sub="awaiting review"
          icon={<Clock className="w-5 h-5" />}
          colorClass={pendingCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}
          highlight={pendingCount > 0}
        />
        <SummaryCard
          title="Approved Amount"
          value={`₹${approvedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub={`${expenses.filter(e => e.approval_status === 'approved').length} approved`}
          icon={<CheckCircle className="w-5 h-5" />}
          colorClass="bg-green-50 text-green-600"
        />
        <SummaryCard
          title={now.toLocaleString('default', { month: 'long' })}
          value={`₹${thisMonthAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub="this month"
          icon={<CalendarDays className="w-5 h-5" />}
          colorClass="bg-slate-100 text-slate-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 px-4 gap-2">
          <div className="flex overflow-x-auto">
            {([
              ['all', 'All Expenses', null],
              ['pending', 'Pending Approval', pendingCount > 0 ? pendingCount : null],
              ['by-trip', 'By Trip', null],
            ] as [TabType, string, number | null][]).map(([key, label, badge]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label}
                {badge !== null && (
                  <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 py-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date From</label>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                  className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date To</label>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                  className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Expense Head</label>
                <select value={filterExpenseHead} onChange={e => setFilterExpenseHead(e.target.value)}
                  className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Heads</option>
                  {expenseHeads.map(h => <option key={h.expense_head_id} value={h.expense_head_id}>{h.expense_head_name}</option>)}
                </select>
              </div>
              {activeTab !== 'pending' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as FilterStatus)}
                    className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Trip</label>
                <select value={filterTrip} onChange={e => setFilterTrip(e.target.value)}
                  className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[180px]">
                  <option value="">All Trips</option>
                  {trips.map(t => <option key={t.trip_id} value={t.trip_id}>{t.trip_number}</option>)}
                </select>
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
            {filteredExpenses.length !== expenses.length && (
              <p className="text-xs text-gray-500 mt-2">
                Showing {filteredExpenses.length} of {expenses.length} expenses
              </p>
            )}
          </div>
        )}

        {activeTab === 'by-trip' ? (
          <ByTripView
            trips={trips}
            allExpenses={filteredExpenses}
            expandedTrips={expandedTrips}
            toggleTrip={toggleTrip}
            canApprove={canApprove}
            onAdd={(tripId) => openAddModal(tripId)}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onApprove={(exp, action) => { setApprovingExpense(exp); setApprovalAction(action); setApprovalRemarks(''); }}
          />
        ) : (
          <ExpenseTableView
            expenses={filteredExpenses}
            canApprove={canApprove}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onApprove={(exp, action) => { setApprovingExpense(exp); setApprovalAction(action); setApprovalRemarks(''); }}
          />
        )}
      </div>

      {showModal && (
        <ExpenseFormModal
          expense={editingExpense}
          trips={trips}
          expenseHeads={expenseHeads}
          preselectedTripId={preselectedTripId}
          onClose={() => { setShowModal(false); setEditingExpense(null); setPreselectedTripId(undefined); }}
          onSaved={loadData}
        />
      )}

      {approvingExpense && approvalAction && (
        <ApprovalModal
          expense={approvingExpense}
          action={approvalAction}
          remarks={approvalRemarks}
          onRemarksChange={setApprovalRemarks}
          loading={approvalLoading}
          onConfirm={handleApprovalConfirm}
          onClose={() => { setApprovingExpense(null); setApprovalAction(null); setApprovalRemarks(''); }}
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

interface ExpenseTableViewProps {
  expenses: TripExpense[];
  canApprove: boolean;
  onEdit: (exp: TripExpense) => void;
  onDelete: (id: string) => void;
  onApprove: (exp: TripExpense, action: 'approve' | 'reject') => void;
}

function ExpenseTableView({ expenses, canApprove, onEdit, onDelete, onApprove }: ExpenseTableViewProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No expenses found</p>
        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or add a new expense</p>
      </div>
    );
  }

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Trip / Vehicle</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Expense Head</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Vendor</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Bill No.</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {expenses.map(exp => (
            <tr key={exp.trip_expense_id} className="hover:bg-gray-50/70 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-800">{exp.trips?.trip_number || '—'}</div>
                {exp.trips?.vehicles?.vehicle_number && (
                  <div className="text-xs text-gray-400 mt-0.5">{exp.trips.vehicles.vehicle_number}</div>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {new Date(exp.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-800">{exp.expense_heads?.expense_head_name || '—'}</div>
                {exp.expense_heads?.category && (
                  <div className="text-xs text-gray-400">{exp.expense_heads.category}</div>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 hidden md:table-cell text-sm">
                {exp.vendors?.vendor_name || <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <span className="text-gray-500 text-xs font-mono">{exp.bill_number || <span className="text-gray-300">—</span>}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="font-semibold text-gray-900 whitespace-nowrap">
                  ₹{exp.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                {exp.attachment_url && (
                  <a href={exp.attachment_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-xs text-blue-400 hover:text-blue-600 mt-0.5">
                    <Paperclip className="w-3 h-3" /> Receipt
                  </a>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={exp.approval_status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  {canApprove && exp.approval_status === 'pending' && (
                    <>
                      <button onClick={() => onApprove(exp, 'approve')} title="Approve"
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => onApprove(exp, 'reject')} title="Reject"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {exp.approval_status === 'pending' && (
                    <button onClick={() => onEdit(exp)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => onDelete(exp.trip_expense_id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t-2 border-gray-200">
            <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700">
              Total ({expenses.length} {expenses.length === 1 ? 'entry' : 'entries'})
            </td>
            <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
              ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

interface ByTripViewProps {
  trips: Trip[];
  allExpenses: TripExpense[];
  expandedTrips: Set<string>;
  toggleTrip: (id: string) => void;
  canApprove: boolean;
  onAdd: (tripId: string) => void;
  onEdit: (exp: TripExpense) => void;
  onDelete: (id: string) => void;
  onApprove: (exp: TripExpense, action: 'approve' | 'reject') => void;
}

function ByTripView({ trips, allExpenses, expandedTrips, toggleTrip, canApprove, onAdd, onEdit, onDelete, onApprove }: ByTripViewProps) {
  const tripGroups = trips.map(trip => ({
    trip,
    expenses: allExpenses.filter(e => e.trip_id === trip.trip_id),
  }));

  if (tripGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Truck className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No arrived trips found</p>
        <p className="text-sm text-gray-400 mt-1">Trips will appear here once Truck Arrival has been processed</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {tripGroups.map(({ trip, expenses }) => {
        const isOpen = expandedTrips.has(trip.trip_id);
        const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const pendingAmt = expenses.filter(e => e.approval_status === 'pending').reduce((s, e) => s + e.amount, 0);
        const needsExpenses = !trip.trip_closure;

        return (
          <div key={trip.trip_id} className="group/trip">
            <div
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${expenses.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => expenses.length > 0 && toggleTrip(trip.trip_id)}
            >
              <div className="shrink-0 text-gray-400 w-4">
                {expenses.length > 0 && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{trip.trip_number}</span>
                  {trip.vehicles?.vehicle_number && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      {trip.vehicles.vehicle_number}
                    </span>
                  )}
                  {trip.routes && (
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      {trip.routes.origin_city} → {trip.routes.destination_city}
                    </span>
                  )}
                  {trip.trip_closure ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle className="w-3 h-3" /> Expenses Closed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      <Clock className="w-3 h-3" /> Pending Closure
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {pendingAmt > 0 && (
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-amber-600 font-medium">
                      ₹{pendingAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })} pending
                    </div>
                  </div>
                )}
                <div className="text-right">
                  {expenses.length > 0 ? (
                    <>
                      <div className="font-bold text-gray-900">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                      <div className="text-xs text-gray-400">{expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}</div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400">No expenses</div>
                  )}
                </div>
                {needsExpenses && (
                  <button
                    onClick={e => { e.stopPropagation(); onAdd(trip.trip_id); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    title="Add expense to this trip"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Expense
                  </button>
                )}
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-gray-100 bg-gray-50/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100/60">
                        <th className="px-8 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Expense Head</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Vendor</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Bill No.</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {expenses.map(exp => (
                        <tr key={exp.trip_expense_id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-8 py-2.5 text-gray-600 whitespace-nowrap text-xs">
                            {new Date(exp.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-gray-800 text-sm">{exp.expense_heads?.expense_head_name || '—'}</div>
                            {exp.description && <div className="text-xs text-gray-400 truncate max-w-[200px]">{exp.description}</div>}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs hidden md:table-cell">
                            {exp.vendors?.vendor_name || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-gray-400 font-mono text-xs hidden lg:table-cell">
                            {exp.bill_number || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                            ₹{exp.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <StatusBadge status={exp.approval_status} />
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              {canApprove && exp.approval_status === 'pending' && (
                                <>
                                  <button onClick={() => onApprove(exp, 'approve')} title="Approve"
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => onApprove(exp, 'reject')} title="Reject"
                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {exp.approval_status === 'pending' && (
                                <button onClick={() => onEdit(exp)}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => onDelete(exp.trip_expense_id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
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
                        <td className="px-4 py-2 text-right text-sm font-bold text-gray-900 whitespace-nowrap">
                          ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  colorClass: string;
  highlight?: boolean;
}

function SummaryCard({ title, value, sub, icon, colorClass, highlight }: SummaryCardProps) {
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${highlight ? 'border-amber-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${colorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface ApprovalModalProps {
  expense: TripExpense;
  action: 'approve' | 'reject';
  remarks: string;
  onRemarksChange: (v: string) => void;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function ApprovalModal({ expense, action, remarks, onRemarksChange, loading, onConfirm, onClose }: ApprovalModalProps) {
  const isApprove = action === 'approve';
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className={`flex items-center gap-3 px-6 py-4 rounded-t-2xl ${isApprove ? 'bg-green-50 border-b border-green-100' : 'bg-red-50 border-b border-red-100'}`}>
          {isApprove
            ? <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
            : <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
          <div>
            <h3 className={`font-bold text-lg ${isApprove ? 'text-green-800' : 'text-red-800'}`}>
              {isApprove ? 'Approve Expense' : 'Reject Expense'}
            </h3>
            <p className="text-xs text-gray-500">
              {expense.trips?.trip_number} · {expense.expense_heads?.expense_head_name}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-500">Amount</p>
              <p className="font-bold text-xl text-gray-900">
                ₹{expense.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-medium text-gray-700">
                {new Date(expense.expense_date).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {isApprove ? 'Approval Notes (optional)' : 'Rejection Reason'}
              {!isApprove && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <textarea
              rows={3}
              placeholder={isApprove ? 'Any notes...' : 'Explain why this expense is being rejected...'}
              value={remarks}
              onChange={e => onRemarksChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || (!isApprove && !remarks.trim())}
            className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors ${isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {loading ? <AlertCircle className="w-4 h-4 animate-pulse" /> : isApprove ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {loading ? 'Processing...' : isApprove ? 'Confirm Approve' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
