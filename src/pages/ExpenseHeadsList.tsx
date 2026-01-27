import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface ExpenseHead {
  expense_head_id: string;
  expense_head_name: string;
  category: string;
}

export function ExpenseHeadsList() {
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHead, setEditingHead] = useState<ExpenseHead | null>(null);
  const [formData, setFormData] = useState({
    expense_head_name: '',
    category: 'Trip Variable',
  });

  useEffect(() => {
    loadExpenseHeads();
  }, []);

  async function loadExpenseHeads() {
    try {
      const { data, error } = await supabase
        .from('expense_heads')
        .select('*')
        .order('category');

      if (error) throw error;
      setExpenseHeads(data || []);
    } catch (error) {
      console.error('Error loading expense heads:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddClick = () => {
    setEditingHead(null);
    setFormData({
      expense_head_name: '',
      category: 'Trip Variable',
    });
    setShowForm(true);
  };

  const handleEditClick = (head: ExpenseHead) => {
    setEditingHead(head);
    setFormData({
      expense_head_name: head.expense_head_name,
      category: head.category,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingHead(null);
    setFormData({
      expense_head_name: '',
      category: 'Trip Variable',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.expense_head_name.trim()) {
      alert('Please enter expense head name');
      return;
    }

    setSaving(true);
    try {
      if (editingHead) {
        const { error } = await supabase
          .from('expense_heads')
          .update({
            expense_head_name: formData.expense_head_name,
            category: formData.category,
          })
          .eq('expense_head_id', editingHead.expense_head_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expense_heads')
          .insert([
            {
              expense_head_name: formData.expense_head_name,
              category: formData.category,
            },
          ]);

        if (error) throw error;
      }

      await loadExpenseHeads();
      handleCloseForm();
    } catch (error) {
      console.error('Error saving expense head:', error);
      alert('Error saving expense head');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense head?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('expense_heads')
        .delete()
        .eq('expense_head_id', id);

      if (error) throw error;
      await loadExpenseHeads();
    } catch (error) {
      console.error('Error deleting expense head:', error);
      alert('Error deleting expense head');
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
        <h2 className="text-xl font-bold">Expense Heads</h2>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Expense Head
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingHead ? 'Edit Expense Head' : 'Add Expense Head'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Head Name *
                </label>
                <input
                  type="text"
                  value={formData.expense_head_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expense_head_name: e.target.value,
                    })
                  }
                  placeholder="Enter expense head name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Trip Variable">Trip Variable</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {saving ? 'Saving...' : editingHead ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Expense Head
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  Loading...
                </td>
              </tr>
            ) : expenseHeads.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  No expense heads found
                </td>
              </tr>
            ) : (
              expenseHeads.map((eh) => (
                <tr key={eh.expense_head_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{eh.expense_head_name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        eh.category === 'Trip Variable'
                          ? 'bg-blue-100 text-blue-800'
                          : eh.category === 'Maintenance'
                            ? 'bg-orange-100 text-orange-800'
                            : eh.category === 'Administrative'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {eh.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(eh)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(eh.expense_head_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
