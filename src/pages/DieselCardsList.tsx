import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Link2, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
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

interface Vehicle {
  vehicle_id: string;
  vehicle_number: string;
  diesel_card_id: string | null;
}

interface CardMapping {
  diesel_card_id: string;
  card_name: string;
  card_number: string;
  provider: string;
  mapped_vehicle_count: number;
  mapped_vehicles: string | null;
}

interface MappingSummary {
  totalCards: number;
  totalVehicles: number;
  mappedCards: number;
  unmappedCards: number;
  mappedVehicles: number;
  unmappedVehicles: number;
  duplicateMappings: Array<{ card_name: string; vehicle_count: number; vehicles: string }>;
  unmappedCardsList: Array<{ card_name: string; card_number: string }>;
  unmappedVehiclesList: Array<{ vehicle_number: string }>;
}

export function DieselCardsList() {
  const [dieselCards, setDieselCards] = useState<DieselCard[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [cardMappings, setCardMappings] = useState<CardMapping[]>([]);
  const [mappingSummary, setMappingSummary] = useState<MappingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [editingCard, setEditingCard] = useState<DieselCard | null>(null);
  const [mappingCard, setMappingCard] = useState<DieselCard | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [formData, setFormData] = useState({
    card_name: '',
    card_number: '',
    card_type: 'Diesel',
    provider: '',
    remarks: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    await Promise.all([
      loadDieselCards(),
      loadVehicles(),
      loadCardMappings(),
    ]);
    setLoading(false);
  }

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
    }
  }

  async function loadVehicles() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('vehicle_id, vehicle_number, diesel_card_id, status')
        .eq('status', 'Active')
        .order('vehicle_number');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  }

  async function loadCardMappings() {
    try {
      const { data, error } = await supabase.rpc('get_diesel_card_mappings');

      if (error) {
        const { data: manualData, error: manualError } = await supabase
          .from('diesel_cards_master')
          .select(`
            diesel_card_id,
            card_name,
            card_number,
            provider
          `)
          .eq('is_active', true);

        if (manualError) throw manualError;

        const mappingsWithCounts = await Promise.all(
          (manualData || []).map(async (card) => {
            const { data: vehicleData } = await supabase
              .from('vehicles')
              .select('vehicle_number')
              .eq('diesel_card_id', card.diesel_card_id)
              .eq('status', 'Active');

            return {
              ...card,
              mapped_vehicle_count: vehicleData?.length || 0,
              mapped_vehicles: vehicleData?.map(v => v.vehicle_number).join(', ') || null,
            };
          })
        );

        setCardMappings(mappingsWithCounts);
      } else {
        setCardMappings(data || []);
      }
    } catch (error) {
      console.error('Error loading card mappings:', error);
    }
  }

  async function generateMappingSummary() {
    try {
      const { data: cards } = await supabase
        .from('diesel_cards_master')
        .select('diesel_card_id, card_name, card_number, provider')
        .eq('is_active', true);

      const { data: allVehicles } = await supabase
        .from('vehicles')
        .select('vehicle_id, vehicle_number, diesel_card_id')
        .eq('status', 'Active');

      const totalCards = cards?.length || 0;
      const totalVehicles = allVehicles?.length || 0;

      const mappedVehicles = allVehicles?.filter(v => v.diesel_card_id) || [];
      const unmappedVehicles = allVehicles?.filter(v => !v.diesel_card_id) || [];

      const cardVehicleCounts = new Map<string, { card: any; vehicles: string[] }>();
      cards?.forEach(card => {
        const vehiclesForCard = mappedVehicles.filter(v => v.diesel_card_id === card.diesel_card_id);
        cardVehicleCounts.set(card.diesel_card_id, {
          card,
          vehicles: vehiclesForCard.map(v => v.vehicle_number),
        });
      });

      const mappedCards = Array.from(cardVehicleCounts.values()).filter(c => c.vehicles.length > 0).length;
      const unmappedCards = totalCards - mappedCards;

      const duplicateMappings = Array.from(cardVehicleCounts.values())
        .filter(c => c.vehicles.length > 1)
        .map(c => ({
          card_name: c.card.card_name,
          vehicle_count: c.vehicles.length,
          vehicles: c.vehicles.join(', '),
        }));

      const unmappedCardsList = Array.from(cardVehicleCounts.values())
        .filter(c => c.vehicles.length === 0)
        .map(c => ({
          card_name: c.card.card_name,
          card_number: c.card.card_number,
        }));

      const summary: MappingSummary = {
        totalCards,
        totalVehicles,
        mappedCards,
        unmappedCards,
        mappedVehicles: mappedVehicles.length,
        unmappedVehicles: unmappedVehicles.length,
        duplicateMappings,
        unmappedCardsList,
        unmappedVehiclesList: unmappedVehicles.map(v => ({ vehicle_number: v.vehicle_number })),
      };

      setMappingSummary(summary);
      setShowSummaryModal(true);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate mapping summary');
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
      loadData();
    } catch (error: any) {
      console.error('Error saving diesel card:', error);
      alert(error.message || 'Failed to save diesel card');
    } finally {
      setSaving(false);
    }
  }

  async function handleMapVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!mappingCard || !selectedVehicleId) return;

    setSaving(true);

    try {
      const selectedVehicle = vehicles.find(v => v.vehicle_id === selectedVehicleId);

      if (selectedVehicle?.diesel_card_id) {
        const confirm = window.confirm(
          `Vehicle ${selectedVehicle.vehicle_number} is already mapped to another diesel card. Do you want to reassign it to ${mappingCard.card_name}?`
        );
        if (!confirm) {
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from('vehicles')
        .update({ diesel_card_id: mappingCard.diesel_card_id })
        .eq('vehicle_id', selectedVehicleId);

      if (error) throw error;

      alert(`Successfully mapped ${mappingCard.card_name} to vehicle`);
      setShowMappingModal(false);
      setMappingCard(null);
      setSelectedVehicleId('');
      loadData();
    } catch (error: any) {
      console.error('Error mapping vehicle:', error);
      alert(error.message || 'Failed to map vehicle to diesel card');
    } finally {
      setSaving(false);
    }
  }

  async function handleUnmapVehicle(cardId: string, vehicleNumber: string) {
    if (!confirm(`Are you sure you want to unmap vehicle ${vehicleNumber} from this diesel card?`)) return;

    try {
      const vehicle = vehicles.find(v => v.vehicle_number === vehicleNumber);
      if (!vehicle) return;

      const { error } = await supabase
        .from('vehicles')
        .update({ diesel_card_id: null })
        .eq('vehicle_id', vehicle.vehicle_id);

      if (error) throw error;

      alert('Vehicle unmapped successfully');
      loadData();
    } catch (error: any) {
      console.error('Error unmapping vehicle:', error);
      alert(error.message || 'Failed to unmap vehicle');
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
      loadData();
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

  function handleOpenMapping(card: DieselCard) {
    setMappingCard(card);
    setSelectedVehicleId('');
    setShowMappingModal(true);
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

  function handleCloseMappingModal() {
    setShowMappingModal(false);
    setMappingCard(null);
    setSelectedVehicleId('');
  }

  const filteredCards = dieselCards.filter(
    (card) =>
      card.card_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableVehicles = vehicles.filter(v =>
    !v.diesel_card_id || v.diesel_card_id === mappingCard?.diesel_card_id
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
        <div className="flex gap-2">
          <button
            onClick={generateMappingSummary}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Mapping Report
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Diesel Card
          </button>
        </div>
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
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mapped Vehicle(s)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No diesel cards found. Click "Add Diesel Card" to create one.
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => {
                  const mapping = cardMappings.find(m => m.diesel_card_id === card.diesel_card_id);
                  const mappedVehicles = mapping?.mapped_vehicles?.split(', ') || [];
                  const hasDuplicates = mappedVehicles.length > 1;

                  return (
                    <tr key={card.diesel_card_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {card.card_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {card.card_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {card.provider || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {mappedVehicles.length === 0 ? (
                          <span className="text-gray-400 italic">No vehicle mapped</span>
                        ) : (
                          <div className="space-y-1">
                            {mappedVehicles.map((vehicle, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  hasDuplicates
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {vehicle}
                                </span>
                                <button
                                  onClick={() => handleUnmapVehicle(card.diesel_card_id, vehicle)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Unmap vehicle"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {hasDuplicates && (
                              <div className="flex items-center gap-1 text-red-600 text-xs">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Multiple vehicles mapped!</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenMapping(card)}
                          className="text-green-600 hover:text-green-900 mr-4"
                          title="Map to vehicle"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
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
                  );
                })
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

      {showMappingModal && mappingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Map Vehicle to {mappingCard.card_name}
              </h2>
              <button
                onClick={handleCloseMappingModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleMapVehicle} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Vehicle *
                </label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select a vehicle --</option>
                  {availableVehicles.map((vehicle) => (
                    <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                      {vehicle.vehicle_number}
                      {vehicle.diesel_card_id === mappingCard.diesel_card_id ? ' (Currently mapped)' : ''}
                    </option>
                  ))}
                </select>
                {availableVehicles.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    No available vehicles to map. All vehicles are already assigned to other cards.
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium">One-to-One Mapping Policy:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Each diesel card should be mapped to only ONE vehicle</li>
                      <li>Each vehicle should have only ONE diesel card</li>
                      <li>Reassigning will update the previous mapping</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseMappingModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedVehicleId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Mapping...' : 'Map Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSummaryModal && mappingSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Diesel Card to Vehicle Mapping Report
              </h2>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium">Total Diesel Cards</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {mappingSummary.totalCards}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium">Total Vehicles</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {mappingSummary.totalVehicles}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium">Mapped Cards</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {mappingSummary.mappedCards}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm text-yellow-600 font-medium">Unmapped Cards</div>
                  <div className="text-2xl font-bold text-yellow-900 mt-1">
                    {mappingSummary.unmappedCards}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium">Mapped Vehicles</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {mappingSummary.mappedVehicles}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm text-yellow-600 font-medium">Unmapped Vehicles</div>
                  <div className="text-2xl font-bold text-yellow-900 mt-1">
                    {mappingSummary.unmappedVehicles}
                  </div>
                </div>
              </div>

              {mappingSummary.duplicateMappings.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-900">
                      Duplicate Mappings Detected
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {mappingSummary.duplicateMappings.map((dup, idx) => (
                      <div key={idx} className="bg-white rounded p-3 text-sm">
                        <div className="font-medium text-red-900">{dup.card_name}</div>
                        <div className="text-red-700">
                          Mapped to {dup.vehicle_count} vehicles: {dup.vehicles}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mappingSummary.unmappedCardsList.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                    Unmapped Diesel Cards ({mappingSummary.unmappedCardsList.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {mappingSummary.unmappedCardsList.map((card, idx) => (
                      <div key={idx} className="bg-white rounded p-3 text-sm">
                        <div className="font-medium text-gray-900">{card.card_name}</div>
                        <div className="text-gray-600">{card.card_number}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mappingSummary.unmappedVehiclesList.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                    Unmapped Vehicles ({mappingSummary.unmappedVehiclesList.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {mappingSummary.unmappedVehiclesList.map((vehicle, idx) => (
                      <div key={idx} className="bg-white rounded p-2 text-sm font-medium text-gray-900">
                        {vehicle.vehicle_number}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mappingSummary.duplicateMappings.length === 0 &&
                mappingSummary.unmappedCards === 0 &&
                mappingSummary.unmappedVehicles === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Perfect One-to-One Mapping!
                    </h3>
                    <p className="text-green-700">
                      All diesel cards are mapped to exactly one vehicle each, and all vehicles have assigned cards.
                    </p>
                  </div>
                )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
