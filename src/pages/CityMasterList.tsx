import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface City {
  city_id: string;
  city_name: string;
  state_id: string;
  tier: string;
  is_active: boolean;
  state?: {
    state_name: string;
    state_abbreviation: string;
  };
}

interface State {
  state_id: string;
  state_name: string;
  state_abbreviation: string;
}

export function CityMasterList() {
  const [cities, setCities] = useState<City[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    city_name: '',
    state_id: '',
    tier: 'Tier 1',
  });

  useEffect(() => {
    loadStates();
    loadCities();
  }, []);

  async function loadStates() {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .eq('is_active', true)
        .order('state_name');

      if (error) throw error;
      setStates(data || []);
    } catch (error) {
      console.error('Error loading states:', error);
    }
  }

  async function loadCities() {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          state:states(state_name, state_abbreviation)
        `)
        .eq('is_active', true)
        .order('city_name');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingCity) {
        const { error } = await supabase
          .from('cities')
          .update({
            city_name: formData.city_name,
            state_id: formData.state_id,
            tier: formData.tier,
            updated_at: new Date().toISOString(),
          })
          .eq('city_id', editingCity.city_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cities')
          .insert({
            city_name: formData.city_name,
            state_id: formData.state_id,
            tier: formData.tier,
          });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingCity(null);
      resetForm();
      loadCities();
    } catch (error: any) {
      console.error('Error saving city:', error);
      if (error.message?.includes('cities_city_name_state_id_key')) {
        alert('A city with this name already exists in the selected state.');
      } else {
        alert(error.message || 'Failed to save city');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this city?')) return;

    try {
      const { error } = await supabase
        .from('cities')
        .update({ is_active: false })
        .eq('city_id', id);

      if (error) throw error;
      loadCities();
    } catch (error: any) {
      alert(error.message);
    }
  }

  function openEditModal(city: City) {
    setEditingCity(city);
    setFormData({
      city_name: city.city_name,
      state_id: city.state_id,
      tier: city.tier,
    });
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingCity(null);
    resetForm();
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      city_name: '',
      state_id: '',
      tier: 'Tier 1',
    });
  }

  const filteredCities = cities.filter((city) => {
    const matchesSearch =
      city.city_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.state?.state_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || city.tier === filterTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search cities or states..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tiers</option>
              <option value="Tier 1">Tier 1</option>
              <option value="Tier 2">Tier 2</option>
            </select>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add City
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">Loading...</td>
                </tr>
              ) : filteredCities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No cities found</td>
                </tr>
              ) : (
                filteredCities.map((city) => (
                  <tr key={city.city_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{city.city_name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {city.state?.state_name}
                      <span className="ml-2 text-gray-400 text-sm">({city.state?.state_abbreviation})</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        city.tier === 'Tier 1'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {city.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(city)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(city.city_id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingCity ? 'Edit City' : 'Add New City'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city_name}
                  onChange={(e) => setFormData({ ...formData, city_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mumbai, Delhi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  required
                  value={formData.state_id}
                  onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.state_id} value={state.state_id}>
                      {state.state_name} ({state.state_abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tier *
                </label>
                <select
                  required
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Tier 1">Tier 1</option>
                  <option value="Tier 2">Tier 2</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-blue-400"
                >
                  {saving ? 'Saving...' : editingCity ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
