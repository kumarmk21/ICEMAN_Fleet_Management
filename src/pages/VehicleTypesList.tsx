import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VehicleType {
  vehicle_type_id: string;
  vehicle_type_name: string;
  capacity_tons: number;
  is_active: boolean;
}

export function VehicleTypesList() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<VehicleType | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_type_name: '',
    capacity_tons: 0,
  });

  useEffect(() => {
    loadVehicleTypes();
  }, []);

  async function loadVehicleTypes() {
    try {
      const { data, error } = await supabase
        .from('vehicle_types_master')
        .select('*')
        .eq('is_active', true)
        .order('vehicle_type_name');

      if (error) throw error;
      setVehicleTypes(data || []);
    } catch (error) {
      console.error('Error loading vehicle types:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingType) {
        const { error } = await supabase
          .from('vehicle_types_master')
          .update({
            vehicle_type_name: formData.vehicle_type_name,
            capacity_tons: formData.capacity_tons,
            updated_at: new Date().toISOString(),
          })
          .eq('vehicle_type_id', editingType.vehicle_type_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vehicle_types_master')
          .insert({
            vehicle_type_name: formData.vehicle_type_name,
            capacity_tons: formData.capacity_tons,
          });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingType(null);
      resetForm();
      loadVehicleTypes();
    } catch (error: any) {
      console.error('Error saving vehicle type:', error);
      alert(error.message || 'Failed to save vehicle type');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this vehicle type?')) return;

    try {
      const { error } = await supabase
        .from('vehicle_types_master')
        .update({ is_active: false })
        .eq('vehicle_type_id', id);

      if (error) throw error;
      loadVehicleTypes();
    } catch (error: any) {
      alert(error.message);
    }
  }

  function openEditModal(vehicleType: VehicleType) {
    setEditingType(vehicleType);
    setFormData({
      vehicle_type_name: vehicleType.vehicle_type_name,
      capacity_tons: vehicleType.capacity_tons,
    });
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingType(null);
    resetForm();
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      vehicle_type_name: '',
      capacity_tons: 0,
    });
  }

  const filteredTypes = vehicleTypes.filter((type) =>
    type.vehicle_type_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicle types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Vehicle Type
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle Type Name</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Capacity (Tons)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">Loading...</td>
                </tr>
              ) : filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">No vehicle types found</td>
                </tr>
              ) : (
                filteredTypes.map((type) => (
                  <tr key={type.vehicle_type_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{type.vehicle_type_name}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{type.capacity_tons}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(type)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.vehicle_type_id)}
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
                {editingType ? 'Edit Vehicle Type' : 'Add New Vehicle Type'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.vehicle_type_name}
                  onChange={(e) => setFormData({ ...formData, vehicle_type_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 32FT MXL, 20FT Container"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (Tons) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.capacity_tons}
                  onChange={(e) => setFormData({ ...formData, capacity_tons: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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
                  {saving ? 'Saving...' : editingType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
