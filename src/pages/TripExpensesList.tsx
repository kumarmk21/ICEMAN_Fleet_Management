import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';

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

export function TripExpensesList() {
  const [closedTrips, setClosedTrips] = useState<Trip[]>([]);
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TripExpense | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    expense_head_id: '',
    vendor_id: '',
    description: '',
    amount: '',
    quantity: '',
    unit: '',
    bill_number: '',
    rate_per_litre: '',
    odometer_reading: '',
    toll_plaza_name: '',
  });

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

  const handleSelectExpenseHead = (headId: string) => {
    const selectedHead = expenseHeads.find(h => h.expense_head_id === headId);
    const unit = selectedHead?.category === 'Trip Variable' && headId.includes('Fuel') ? 'L' : '';
    setFormData({
      ...formData,
      expense_head_id: headId,
      unit: unit,
      rate_per_litre: selectedHead?.category === 'Trip Variable' && headId.includes('Fuel') ? '' : undefined,
      odometer_reading: selectedHead?.category === 'Trip Variable' && headId.includes('Fuel') ? '' : undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !formData.expense_head_id || !formData.amount) {
      alert('Please fill all mandatory fields');
      return;
    }

    setSaving(true);
    try {
      const expenseData = {
        trip_id: selectedTrip,
        expense_date: formData.expense_date,
        expense_head_id: formData.expense_head_id,
        vendor_id: formData.vendor_id || null,
        description: formData.description,
        amount: parseFloat(formData.amount),
        quantity: formData.quantity ? parseFloat(formData.quantity) : 0,
        unit: formData.unit,
        bill_number: formData.bill_number,
        rate_per_litre: formData.rate_per_litre ? parseFloat(formData.rate_per_litre) : null,
        odometer_reading: formData.odometer_reading ? parseFloat(formData.odometer_reading) : null,
        toll_plaza_name: formData.toll_plaza_name,
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('trip_expenses')
          .update(expenseData)
          .eq('trip_expense_id', editingExpense.trip_expense_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trip_expenses')
          .insert([expenseData]);

        if (error) throw error;
      }

      await loadExpenses(selectedTrip);
      setFormData({
        expense_date: new Date().toISOString().split('T')[0],
        expense_head_id: '',
        vendor_id: '',
        description: '',
        amount: '',
        quantity: '',
        unit: '',
        bill_number: '',
        rate_per_litre: '',
        odometer_reading: '',
        toll_plaza_name: '',
      });
      setShowAddForm(false);
      setEditingExpense(null);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense: TripExpense) => {
    setEditingExpense(expense);
    setFormData({
      expense_date: expense.expense_date,
      expense_head_id: expense.expense_head_id,
      vendor_id: expense.vendor_id || '',
      description: expense.description,
      amount: expense.amount.toString(),
      quantity: expense.quantity.toString(),
      unit: expense.unit,
      bill_number: expense.bill_number,
      rate_per_litre: expense.rate_per_litre?.toString() || '',
      odometer_reading: expense.odometer_reading?.toString() || '',
      toll_plaza_name: expense.toll_plaza_name || '',
    });
    setShowAddForm(true);
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

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingExpense(null);
    setFormData({
      expense_date: new Date().toISOString().split('T')[0],
      expense_head_id: '',
      vendor_id: '',
      description: '',
      amount: '',
      quantity: '',
      unit: '',
      bill_number: '',
      rate_per_litre: '',
      odometer_reading: '',
      toll_plaza_name: '',
    });
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
      {/* Trip Selection */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Closed Trip</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {closedTrips.map((trip) => (
              <button
                key={trip.trip_id}
                onClick={() => setSelectedTrip(trip.trip_id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedTrip === trip.trip_id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">{trip.trip_number}</p>
                <p className="text-sm text-gray-600">
                  {trip.vehicles?.vehicle_number} - {trip.origin} to {trip.destination}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(trip.actual_start_datetime).toLocaleDateString('en-IN')}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedTrip && selectedTripData && (
        <>
          {/* Trip Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Trip Number</p>
                <p className="font-medium text-gray-900">{selectedTripData.trip_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Vehicle</p>
                <p className="font-medium text-gray-900">{selectedTripData.vehicles?.vehicle_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Route</p>
                <p className="font-medium text-gray-900">{selectedTripData.origin} - {selectedTripData.destination}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Freight Revenue</p>
                <p className="font-medium text-gray-900">₹{selectedTripData.freight_revenue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Add Expense Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          )}

          {/* Add/Edit Expense Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expense Date *
                    </label>
                    <input
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expense Head *
                    </label>
                    <select
                      value={formData.expense_head_id}
                      onChange={(e) => handleSelectExpenseHead(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor
                    </label>
                    <select
                      value={formData.vendor_id}
                      onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.vendor_id} value={vendor.vendor_id}>
                          {vendor.vendor_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bill Number
                    </label>
                    <input
                      type="text"
                      value={formData.bill_number}
                      onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })}
                      placeholder="Enter bill number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., Ltr, Kg, Piece"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {formData.rate_per_litre !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rate per Litre (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.rate_per_litre}
                        onChange={(e) => setFormData({ ...formData, rate_per_litre: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {formData.odometer_reading !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Odometer Reading (KM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.odometer_reading}
                        onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {formData.toll_plaza_name !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Toll Plaza Name
                      </label>
                      <input
                        type="text"
                        value={formData.toll_plaza_name}
                        onChange={(e) => setFormData({ ...formData, toll_plaza_name: e.target.value })}
                        placeholder="Enter toll plaza name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter expense description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Expenses List */}
          {!showAddForm && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Expenses ({expenses.length})
                </h3>
              </div>

              {expenses.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No expenses added for this trip
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Date</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Expense Type</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Description</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Vendor</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-700">Qty/Unit</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-700">Amount</th>
                          <th className="px-6 py-3 text-center font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {expenses.map((expense) => (
                          <tr key={expense.trip_expense_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-gray-900">
                              {new Date(expense.expense_date).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-6 py-4 text-gray-900 font-medium">
                              {expense.expense_heads?.expense_head_name}
                            </td>
                            <td className="px-6 py-4 text-gray-700">{expense.description}</td>
                            <td className="px-6 py-4 text-gray-700">
                              {expense.vendors?.vendor_name || '-'}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-700">
                              {expense.quantity > 0
                                ? `${expense.quantity} ${expense.unit}`
                                : '-'}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                              ₹{expense.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(expense)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(expense.trip_expense_id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <div className="text-lg font-semibold text-gray-900">
                      Total Expenses: ₹{totalExpenses.toFixed(2)}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
