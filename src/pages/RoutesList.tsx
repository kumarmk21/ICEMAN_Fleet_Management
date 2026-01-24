import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Eye, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RouteForm {
  route_code: string;
  origin_city_id: string;
  destination_city_id: string;
  standard_distance_km: number;
  distance_google: number;
  standard_transit_time_days: number;
  remarks: string;
}

interface City {
  city_id: string;
  city_name: string;
  state_id: string;
  states?: {
    state_name: string;
  };
}

export function RoutesList() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRoute, setViewingRoute] = useState<any>(null);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [fetchingDistance, setFetchingDistance] = useState(false);
  const [formData, setFormData] = useState<RouteForm>({
    route_code: '',
    origin_city_id: '',
    destination_city_id: '',
    standard_distance_km: 0,
    distance_google: 0,
    standard_transit_time_days: 0,
    remarks: '',
  });

  useEffect(() => {
    loadRoutes();
    loadCities();
  }, []);

  async function loadRoutes() {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          origin_city:cities!routes_origin_city_id_fkey(city_id, city_name, states(state_name)),
          destination_city:cities!routes_destination_city_id_fkey(city_id, city_name, states(state_name))
        `)
        .order('route_code');

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCities() {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select(`
          city_id,
          city_name,
          state_id,
          states(state_name)
        `)
        .eq('is_active', true)
        .order('city_name');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  }

  async function generateRouteCode() {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('route_code')
        .order('route_code', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0 && data[0].route_code) {
        const lastCode = data[0].route_code;
        const numPart = lastCode.replace('S', '');
        nextNumber = parseInt(numPart) + 1;
      }

      return `S${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating route code:', error);
      return 'S0001';
    }
  }

  async function fetchGoogleDistance() {
    if (!formData.origin_city_id || !formData.destination_city_id) {
      alert('Please select both origin and destination cities');
      return;
    }

    const originCity = cities.find(c => c.city_id === formData.origin_city_id);
    const destCity = cities.find(c => c.city_id === formData.destination_city_id);

    if (!originCity || !destCity) return;

    setFetchingDistance(true);

    try {
      const origin = `${originCity.city_name}, India`;
      const destination = `${destCity.city_name}, India`;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-distance`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ origin, destination }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch distance from Google Maps');
      }

      const data = await response.json();

      if (data.distance_km && data.transit_days) {
        setFormData({
          ...formData,
          distance_google: data.distance_km,
          standard_transit_time_days: data.transit_days,
        });
      } else if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert('Could not fetch distance from Google Maps. Please enter manually.');
      }
    } catch (error) {
      console.error('Error fetching Google distance:', error);
      alert('Error fetching distance from Google Maps. Please enter manually.');
    } finally {
      setFetchingDistance(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const originCity = cities.find(c => c.city_id === formData.origin_city_id);
      const destCity = cities.find(c => c.city_id === formData.destination_city_id);

      const submitData = {
        route_code: formData.route_code,
        origin_city_id: formData.origin_city_id,
        destination_city_id: formData.destination_city_id,
        origin: originCity?.city_name || '',
        destination: destCity?.city_name || '',
        standard_distance_km: Number(formData.standard_distance_km),
        distance_google: Number(formData.distance_google),
        standard_transit_time_days: Number(formData.standard_transit_time_days),
        remarks: formData.remarks,
      };

      if (editingRoute) {
        const { error } = await supabase
          .from('routes')
          .update(submitData)
          .eq('route_id', editingRoute.route_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('routes')
          .insert([submitData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingRoute(null);
      resetForm();
      loadRoutes();
    } catch (error: any) {
      console.error('Error saving route:', error);
      alert(error.message || 'Failed to save route');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('route_id', id);

      if (error) throw error;
      loadRoutes();
    } catch (error: any) {
      console.error('Error deleting route:', error);
      alert(error.message || 'Failed to delete route');
    }
  }

  function openEditModal(route: any) {
    setEditingRoute(route);
    setFormData({
      route_code: route.route_code || '',
      origin_city_id: route.origin_city_id || '',
      destination_city_id: route.destination_city_id || '',
      standard_distance_km: route.standard_distance_km || 0,
      distance_google: route.distance_google || 0,
      standard_transit_time_days: route.standard_transit_time_days || 0,
      remarks: route.remarks || '',
    });
    setShowModal(true);
  }

  async function openCreateModal() {
    setEditingRoute(null);
    const newCode = await generateRouteCode();
    setFormData({
      route_code: newCode,
      origin_city_id: '',
      destination_city_id: '',
      standard_distance_km: 0,
      distance_google: 0,
      standard_transit_time_days: 0,
      remarks: '',
    });
    setShowModal(true);
  }

  function openViewModal(route: any) {
    setViewingRoute(route);
    setShowViewModal(true);
  }

  function resetForm() {
    setFormData({
      route_code: '',
      origin_city_id: '',
      destination_city_id: '',
      standard_distance_km: 0,
      distance_google: 0,
      standard_transit_time_days: 0,
      remarks: '',
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Routes Master</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Route
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Std Distance (KM)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Google Distance (KM)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transit Days</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center">Loading...</td></tr>
            ) : routes.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No routes found</td></tr>
            ) : (
              routes.map((route) => (
                <tr key={route.route_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{route.route_code}</td>
                  <td className="px-6 py-4">{route.origin_city?.city_name || route.origin}</td>
                  <td className="px-6 py-4">{route.destination_city?.city_name || route.destination}</td>
                  <td className="px-6 py-4 text-right">{route.standard_distance_km}</td>
                  <td className="px-6 py-4 text-right">{route.distance_google || '-'}</td>
                  <td className="px-6 py-4 text-right">{route.standard_transit_time_days}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openViewModal(route)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-50 rounded-lg mr-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(route)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg mr-2 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(route.route_id)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingRoute(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Route Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.route_code}
                    onChange={(e) => setFormData({ ...formData, route_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="Auto-generated"
                    readOnly={!editingRoute}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated with prefix "S"
                  </p>
                </div>

                <div className="col-span-2 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Route Details</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Origin City <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.origin_city_id}
                    onChange={(e) => setFormData({ ...formData, origin_city_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Origin</option>
                    {cities.map((city) => (
                      <option key={city.city_id} value={city.city_id}>
                        {city.city_name}, {city.states?.state_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination City <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.destination_city_id}
                    onChange={(e) => setFormData({ ...formData, destination_city_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Destination</option>
                    {cities.map((city) => (
                      <option key={city.city_id} value={city.city_id}>
                        {city.city_name}, {city.states?.state_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={fetchGoogleDistance}
                    disabled={fetchingDistance || !formData.origin_city_id || !formData.destination_city_id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    {fetchingDistance ? 'Fetching from Google Maps...' : 'Fetch Distance from Google Maps'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Click to auto-populate distance and transit time from Google Maps
                  </p>
                </div>

                <div className="col-span-2 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Distance & Performance</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Standard Distance (KM) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.standard_distance_km}
                    onChange={(e) => setFormData({ ...formData, standard_distance_km: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Distance (KM)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.distance_google}
                    onChange={(e) => setFormData({ ...formData, distance_google: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                    placeholder="Auto-captured from Google"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-captured from Google Maps API
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Standard Transit Time (Days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0"
                    value={formData.standard_transit_time_days}
                    onChange={(e) => setFormData({ ...formData, standard_transit_time_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-populated from Google or enter manually
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes about this route"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoute(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : editingRoute ? 'Update Route' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Route Details</h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingRoute(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Route Code</h4>
                  <p className="text-gray-900 font-medium text-lg">{viewingRoute.route_code}</p>
                </div>

                <div className="col-span-2 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Route Details</h4>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Origin</h4>
                  <p className="text-gray-900 font-medium">
                    {viewingRoute.origin_city?.city_name || viewingRoute.origin}
                  </p>
                  {viewingRoute.origin_city?.states?.state_name && (
                    <p className="text-sm text-gray-600">{viewingRoute.origin_city.states.state_name}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Destination</h4>
                  <p className="text-gray-900 font-medium">
                    {viewingRoute.destination_city?.city_name || viewingRoute.destination}
                  </p>
                  {viewingRoute.destination_city?.states?.state_name && (
                    <p className="text-sm text-gray-600">{viewingRoute.destination_city.states.state_name}</p>
                  )}
                </div>

                <div className="col-span-2 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Distance & Performance</h4>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Standard Distance</h4>
                  <p className="text-gray-900 text-2xl font-semibold">{viewingRoute.standard_distance_km} <span className="text-sm text-gray-600">KM</span></p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Google Distance</h4>
                  <p className="text-gray-900 text-2xl font-semibold">
                    {viewingRoute.distance_google || '-'} {viewingRoute.distance_google && <span className="text-sm text-gray-600">KM</span>}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Standard Transit Time</h4>
                  <p className="text-gray-900 text-2xl font-semibold">{viewingRoute.standard_transit_time_days} <span className="text-sm text-gray-600">Days</span></p>
                </div>

                {viewingRoute.remarks && (
                  <div className="col-span-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Remarks</h4>
                    <p className="text-gray-900 whitespace-pre-wrap">{viewingRoute.remarks}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingRoute(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(viewingRoute);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
