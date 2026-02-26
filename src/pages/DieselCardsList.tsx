import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DieselCard {
  diesel_card_id: string;
  card_name: string;
  card_number: string;
  card_type: string;
  provider: string;
  is_active: boolean;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export function DieselCardsList() {
  const [dieselCards, setDieselCards] = useState<DieselCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<DieselCard | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    card_name: '',
    card_number: '',
    card_type: 'Diesel',
    provider: '',
    remarks: '',
  });

  useEffect(() => {
    loadDieselCards();
  }, []);

  async function loadDieselCards() {
    try {
      const { data, error } = await supabase
        .from('diesel_cards_master')
        .select('*')
        .eq('is_active', true)
        .order('card_name');

      if (error) throw error;
      setDieselCards(data || []);
    } catch (error) {
      console.error('Error loading diesel cards:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingCard) {
        const { error } = await supabase
          .from('diesel_cards_master')
          .update(formData)
          .eq('diesel_card_id', editingCard.diesel_card_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('diesel_cards_master')
          .insert(formData);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingCard(null);
      resetForm();
      loadDieselCards();
    } catch (error: any) {
      console.error('Error saving diesel card:', error);
      alert(error.message || 'Failed to save diesel card');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this diesel card?')) return;

    try {
      const { error } = await supabase
        .from('diesel_cards_master')
        .update({ is_active: false })
        .eq('diesel_card_id', id);

      if (error) throw error;
      loadDieselCards();
    } catch (error: any) {
      console.error('Error deleting diesel card:', error);
      alert(error.message || 'Failed to delete diesel card');
    }
  }

  function handleEdit(card: DieselCard) {
    setEditingCard(card);
    setFormData({
      card_name: card.card_name,
      card_number: card.card_number,
      card_type: card.card_type,
      provider: card.provider,
      remarks: card.remarks,
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      card_name: '',
      card_number: '',
      card_type: 'Diesel',
      provider: '',
      remarks: '',
    });
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingCard(null);
    resetForm();
  }

  const filteredCards = dieselCards.filter(
    (card) =>
      card.card_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search diesel cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Diesel Card
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No diesel cards found. Click "Add Diesel Card" to create one.
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => (
                  <tr key={card.diesel_card_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {card.card_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {card.card_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        card.card_type === 'Diesel'
                          ? 'bg-green-100 text-green-800'
                          : card.card_type === 'FASTag'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {card.card_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {card.provider || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {card.remarks || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(card)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(card.diesel_card_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCard ? 'Edit Diesel Card' : 'Add Diesel Card'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.card_name}
                    onChange={(e) =>
                      setFormData({ ...formData, card_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ICICI Diesel Card 001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.card_number}
                    onChange={(e) =>
                      setFormData({ ...formData, card_number: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter card number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Type *
                  </label>
                  <select
                    required
                    value={formData.card_type}
                    onChange={(e) =>
                      setFormData({ ...formData, card_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="FASTag">FASTag</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider
                  </label>
                  <input
                    type="text"
                    value={formData.provider}
                    onChange={(e) =>
                      setFormData({ ...formData, provider: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ICICI Bank, HDFC Bank"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCard ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
