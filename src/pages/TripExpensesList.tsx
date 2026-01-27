import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';

interface Trip {
  trip_id: string;
  trip_number: string;
  vehicle_id: string;
  origin: string;
  destination: string;
  actual_start_datetime: string;
  actual_end_datetime: string;
  freight_revenue: number;
  vehicles?: { vehicle_number: string };
}

interface ExpenseHead {
  expense_head_id: string;
  expense_head_name: string;
  category: string;
}

interface Vendor {
  vendor_id: string;
  vendor_name: string;
  vendor_type: string;
}

interface TripExpense {
  trip_expense_id: string;
  trip_id: string;
  expense_date: string;
  expense_head_id: string;
  vendor_id: string | null;
  description: string;
  amount: number;
  quantity: number;
  unit: string;
  bill_number: string;
  rate_per_litre?: number;
  odometer_reading?: number;
  toll_plaza_name?: string;
  expense_heads?: { expense_head_name: string };
  vendors?: { vendor_name: string };
}

interface NewExpenseItem {
  id: string;
  expense_head_id: string;
  vendor_id: string;
  description: string;
  amount: string;
  quantity: string;
  unit: string;
  bill_number: string;
  expense_date: string;
  rate_per_litre: string;
  odometer_reading: string;
  toll_plaza_name: string;
}

export function TripExpensesList() {
  const [closedTrips, setClosedTrips] = useState<Trip[]>([]);
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [newItems, setNewItems] = useState<NewExpenseItem[]>([]);
  const [editingExpense, setEditingExpense] = useState<TripExpense | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      loadExpenses(selectedTrip);
    }
  }, [selectedTrip]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tripsRes, headsRes, vendorsRes] = await Promise.all([
        supabase
          .from('trips')
          .select(`
            trip_id,
            trip_number,
            vehicle_id,
            origin,
            destination,
            actual_start_datetime,
            actual_end_datetime,
            freight_revenue,
            vehicles(vehicle_number)
          `)
          .eq('trip_status', 'Closed')
          .order('actual_end_datetime', { ascending: false }),
        supabase
          .from('expense_heads')
          .select('*')
          .order('expense_head_name'),
        supabase
          .from('vendors')
          .select('*')
          .order('vendor_name'),
      ]);

      if (tripsRes.data) setClosedTrips(tripsRes.data);
      if (headsRes.data) setExpenseHeads(headsRes.data);
      if (vendorsRes.data) setVendors(vendorsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async (tripId: string) => {
    try {
      const { data } = await supabase
        .from('trip_expenses')
        .select(`
          *,
          expense_heads(expense_head_name),
          vendors(vendor_name)
        `)
        .eq('trip_id', tripId)
        .order('expense_date', { ascending: false });

      if (data) setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const createNewItem = () => {
    const newId = `temp-${Date.now()}`;
    setNewItems([
      ...newItems,
      {
        id: newId,
        expense_head_id: '',
        vendor_id: '',
        description: '',
        amount: '',
        quantity: '',
        unit: '',
        bill_number: '',
        expense_date: new Date().toISOString().split('T')[0],
        rate_per_litre: '',
        odometer_reading: '',
        toll_plaza_name: '',
      },
    ]);
  };

  const updateItem = (id: string, field: string, value: string) => {
    setNewItems(
      newItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setNewItems(newItems.filter((item) => item.id !== id));
  };

  const handleSaveItems = async () => {
    if (!selectedTrip) return;

    const itemsToSave = newItems.filter(
      (item) => item.expense_head_id && item.amount
    );

    if (itemsToSave.length === 0) {
      alert('Please fill in at least one expense with head and amount');
      return;
    }

    setSaving(true);
    try {
      const expenseData = itemsToSave.map((item) => ({
        trip_id: selectedTrip,
        expense_date: item.expense_date,
        expense_head_id: item.expense_head_id,
        vendor_id: item.vendor_id || null,
        description: item.description,
        amount: parseFloat(item.amount),
        quantity: item.quantity ? parseFloat(item.quantity) : 0,
        unit: item.unit,
        bill_number: item.bill_number,
        rate_per_litre: item.rate_per_litre ? parseFloat(item.rate_per_litre) : null,
        odometer_reading: item.odometer_reading
          ? parseFloat(item.odometer_reading)
          : null,
        toll_plaza_name: item.toll_plaza_name,
      }));

      const { error } = await supabase
        .from('trip_expenses')
        .insert(expenseData);

      if (error) throw error;

      await loadExpenses(selectedTrip);
      setNewItems([]);
    } catch (error) {
      console.error('Error saving expenses:', error);
      alert('Error saving expenses');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('trip_expenses')
        .delete()
        .eq('trip_expense_id', expenseId);

      if (error) throw error;
      if (selectedTrip) await loadExpenses(selectedTrip);
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error deleting expense');
    }
  };

  const selectedTripData = closedTrips.find(t => t.trip_id === selectedTrip);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trip List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Closed Trips</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {closedTrips.map((trip) => (
            <div key={trip.trip_id} className="p-4">
              <button
                onClick={() => {
                  setSelectedTrip(trip.trip_id);
                  setExpandedTrip(expandedTrip === trip.trip_id ? null : trip.trip_id);
                }}
                className="w-full flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-colors"
              >
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{trip.trip_number}</p>
                  <p className="text-sm text-gray-600">
                    {trip.vehicles?.vehicle_number} - {trip.origin} to {trip.destination}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(trip.actual_start_datetime).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedTrip === trip.trip_id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedTrip === trip.trip_id && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  <TripExpensesSection
                    trip={trip}
                    tripExpenses={selectedTrip === trip.trip_id ? expenses : []}
                    newItems={selectedTrip === trip.trip_id ? newItems : []}
                    expenseHeads={expenseHeads}
                    vendors={vendors}
                    onAddItem={
                      selectedTrip === trip.trip_id
                        ? createNewItem
                        : () => setSelectedTrip(trip.trip_id)
                    }
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onSaveItems={handleSaveItems}
                    onDeleteExpense={handleDelete}
                    saving={saving}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

interface TripExpensesSectionProps {
  trip: Trip;
  tripExpenses: TripExpense[];
  newItems: NewExpenseItem[];
  expenseHeads: ExpenseHead[];
  vendors: Vendor[];
  onAddItem: () => void;
  onUpdateItem: (id: string, field: string, value: string) => void;
  onRemoveItem: (id: string) => void;
  onSaveItems: () => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  saving: boolean;
}

function TripExpensesSection({
  trip,
  tripExpenses,
  newItems,
  expenseHeads,
  vendors,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onSaveItems,
  onDeleteExpense,
  saving,
}: TripExpensesSectionProps) {
  const totalExisting = tripExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalNew = newItems
    .filter((item) => item.amount)
    .reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);

  return (
    <div className="space-y-4">
      {/* Trip Summary */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Vehicle</p>
            <p className="font-medium text-gray-900">{trip.vehicles?.vehicle_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Route</p>
            <p className="font-medium text-gray-900">{trip.origin} - {trip.destination}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Freight Revenue</p>
            <p className="font-medium text-gray-900">₹{trip.freight_revenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Total Expenses</p>
            <p className="font-medium text-gray-900">₹{(totalExisting + totalNew).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* New Items Form */}
      {newItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-4">New Expense Items</h4>
          <div className="space-y-3">
            {newItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-blue-200 rounded-lg p-4 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Expense Date
                    </label>
                    <input
                      type="date"
                      value={item.expense_date}
                      onChange={(e) =>
                        onUpdateItem(item.id, 'expense_date', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Expense Head *
                    </label>
                    <select
                      value={item.expense_head_id}
                      onChange={(e) =>
                        onUpdateItem(item.id, 'expense_head_id', e.target.value)
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Expense Head</option>
                      {expenseHeads.map((head) => (
                        <option key={head.expense_head_id} value={head.expense_head_id}>
                          {head.expense_head_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Vendor
                    </label>
                    <select
                      value={item.vendor_id}
                      onChange={(e) => onUpdateItem(item.id, 'vendor_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.vendor_id} value={vendor.vendor_id}>
                          {vendor.vendor_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => onUpdateItem(item.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => onUpdateItem(item.id, 'quantity', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => onUpdateItem(item.id, 'unit', e.target.value)}
                      placeholder="e.g., Ltr, Kg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Bill Number
                    </label>
                    <input
                      type="text"
                      value={item.bill_number}
                      onChange={(e) => onUpdateItem(item.id, 'bill_number', e.target.value)}
                      placeholder="Bill #"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={item.description}
                    onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                    placeholder="Enter description"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onAddItem}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add Another Item
            </button>
            <button
              onClick={onSaveItems}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save All Items'}
            </button>
          </div>
        </div>
      )}

      {newItems.length === 0 && (
        <button
          onClick={onAddItem}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Add Expense Item
        </button>
      )}

      {/* Existing Expenses */}
      {tripExpenses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900">Existing Expenses</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Expense Type</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Description</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Vendor</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Qty/Unit</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tripExpenses.map((expense) => (
                  <tr key={expense.trip_expense_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900 text-xs">
                      {new Date(expense.expense_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-2 text-gray-900 font-medium text-xs">
                      {expense.expense_heads?.expense_head_name}
                    </td>
                    <td className="px-4 py-2 text-gray-700 text-xs">{expense.description}</td>
                    <td className="px-4 py-2 text-gray-700 text-xs">
                      {expense.vendors?.vendor_name || '-'}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700 text-xs">
                      {expense.quantity > 0
                        ? `${expense.quantity} ${expense.unit}`
                        : '-'}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900 text-xs">
                      ₹{expense.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => onDeleteExpense(expense.trip_expense_id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded inline-block"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
            <p className="font-semibold text-gray-900">
              Subtotal: ₹{totalExisting.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
