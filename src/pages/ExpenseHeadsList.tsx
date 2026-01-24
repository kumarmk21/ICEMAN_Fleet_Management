import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function ExpenseHeadsList() {
  const [expenseHeads, setExpenseHeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold">Expense Heads</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expense Head</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={2} className="px-6 py-12 text-center">Loading...</td></tr>
            ) : (
              expenseHeads.map((eh) => (
                <tr key={eh.expense_head_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{eh.expense_head_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      eh.category === 'Trip Variable' ? 'bg-blue-100 text-blue-800' :
                      eh.category === 'Maintenance' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {eh.category}
                    </span>
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
