import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Eye, Navigation, MapPin } from 'lucide-react';
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

interface Waypoint {
  waypoint_id?: string;
  sequence_number: number;
  city_id: string;
  city_name: string;
  distance_from_previous_km: number;
  estimated_time_from_previous_hours: number;
  stop_type: 'Pickup' | 'Delivery' | 'Both';
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
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
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

  async function loadWaypoints(routeId: string) {
    try {
      const { data, error } = await supabase
        .from('route_waypoints')
        .select('*')
        .eq('route_id', routeId)
        .order('sequence_number');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading waypoints:', error);
      return [];
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

    for (const waypoint of waypoints) {
      if (!waypoint.city_id) {
        alert('Please select cities for all waypoints before fetching distances');
        return;
      }
    }

    const originCity = cities.find(c => c.city_id === formData.origin_city_id);
    const destCity = cities.find(c => c.city_id === formData.destination_city_id);

    if (!originCity || !destCity) return;

    setFetchingDistance(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-distance`;

      const points = [originCity.city_name];
      for (const waypoint of waypoints) {
        const city = cities.find(c => c.city_id === waypoint.city_id);
        if (city) {
          points.push(city.city_name);
        }
      }
      points.push(destCity.city_name);

      let totalDistance = 0;
      let totalTransitDays = 0;
      const updatedWaypoints = [...waypoints];

      for (let i = 0; i < points.length - 1; i++) {
        const origin = `${points[i]}, India`;
        const destination = `${points[i + 1]}, India`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ origin, destination }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch distance from ${origin} to ${destination}`);
        }

        const data = await response.json();

        if (data.distance_km && data.transit_days) {
          totalDistance += data.distance_km;
          totalTransitDays += data.transit_days;

          if (i > 0 && i <= waypoints.length) {
            updatedWaypoints[i - 1].distance_from_previous_km = data.distance_km;
            updatedWaypoints[i - 1].estimated_time_from_previous_hours = data.transit_days * 24;
          }
        } else if (data.error) {
          alert(`Error fetching distance from ${origin} to ${destination}: ${data.error}`);
          return;
        } else {
          alert(`Could not fetch distance from ${origin} to ${destination}. Please enter manually.`);
          return;
        }
      }

      setWaypoints(updatedWaypoints);
      setFormData({
        ...formData,
        distance_google: totalDistance,
        standard_transit_time_days: totalTransitDays,
      });

      alert('Distances fetched successfully for all waypoints!');
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

      let routeId: string;

      if (editingRoute) {
        const { error } = await supabase
          .from('routes')
          .update(submitData)
          .eq('route_id', editingRoute.route_id);

        if (error) throw error;
        routeId = editingRoute.route_id;

        const { error: deleteError } = await supabase
          .from('route_waypoints')
          .delete()
          .eq('route_id', routeId);

        if (deleteError) throw deleteError;
      } else {
        const { data, error } = await supabase
          .from('routes')
          .insert([submitData])
          .select()
          .single();

        if (error) throw error;
        routeId = data.route_id;
      }

      if (waypoints.length > 0) {
        const waypointsData = waypoints.map((wp, index) => {
          const city = cities.find(c => c.city_id === wp.city_id);
          return {
            route_id: routeId,
            sequence_number: index + 1,
            city_id: wp.city_id,
            city_name: city?.city_name || wp.city_name,
            distance_from_previous_km: Number(wp.distance_from_previous_km),
            estimated_time_from_previous_hours: Number(wp.estimated_time_from_previous_hours),
            stop_type: wp.stop_type,
            remarks: wp.remarks,
          };
        });

        const { error: waypointError } = await supabase
          .from('route_waypoints')
          .insert(waypointsData);

        if (waypointError) throw waypointError;
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

  async function openEditModal(route: any) {
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

    const loadedWaypoints = await loadWaypoints(route.route_id);
    setWaypoints(loadedWaypoints);
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
    setWaypoints([]);
    setShowModal(true);
  }

  async function openViewModal(route: any) {
    const loadedWaypoints = await loadWaypoints(route.route_id);
    setViewingRoute({ ...route, waypoints: loadedWaypoints });
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
    setWaypoints([]);
  }

  function addWaypoint() {
    const newWaypoint: Waypoint = {
      sequence_number: waypoints.length + 1,
      city_id: '',
      city_name: '',
      distance_from_previous_km: 0,
      estimated_time_from_previous_hours: 0,
      stop_type: 'Delivery',
      remarks: '',
    };
    setWaypoints([...waypoints, newWaypoint]);
  }

  function removeWaypoint(index: number) {
    const updated = waypoints.filter((_, i) => i !== index);
    const resequenced = updated.map((wp, i) => ({
      ...wp,
      sequence_number: i + 1,
    }));
    setWaypoints(resequenced);
  }

  function updateWaypoint(index: number, field: keyof Waypoint, value: any) {
    const updated = [...waypoints];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'city_id') {
      const city = cities.find(c => c.city_id === value);
      if (city) {
        updated[index].city_name = city.city_name;
      }
    }

    setWaypoints(updated);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Routes Master</h2>
            <p className="text-sm text-gray-600 mt-1">Manage point-to-point and multi-point delivery routes</p>
          </div>
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
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Std Distance (KM)</th>
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
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                      <MapPin className="w-3 h-3" />
                      Direct
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">{route.standard_distance_km}</td>
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
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
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

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700">Multi-Point Delivery (Milk Run)</h4>
                      <p className="text-xs text-gray-600 mt-1">Add intermediate stops between origin and destination</p>
                    </div>
                    <button
                      type="button"
                      onClick={addWaypoint}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Waypoint
                    </button>
                  </div>

                  {waypoints.length > 0 && (
                    <div className="space-y-3 mt-3">
                      {waypoints.map((waypoint, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="text-sm font-medium text-gray-700">Waypoint {index + 1}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeWaypoint(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                City <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={waypoint.city_id}
                                onChange={(e) => updateWaypoint(index, 'city_id', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select City</option>
                                {cities.map((city) => (
                                  <option key={city.city_id} value={city.city_id}>
                                    {city.city_name}, {city.states?.state_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Stop Type
                              </label>
                              <select
                                value={waypoint.stop_type}
                                onChange={(e) => updateWaypoint(index, 'stop_type', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="Pickup">Pickup</option>
                                <option value="Delivery">Delivery</option>
                                <option value="Both">Both</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Distance from Previous (KM)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={waypoint.distance_from_previous_km}
                                onChange={(e) => updateWaypoint(index, 'distance_from_previous_km', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Est. Time from Previous (Hours)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={waypoint.estimated_time_from_previous_hours}
                                onChange={(e) => updateWaypoint(index, 'estimated_time_from_previous_hours', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                              <input
                                type="text"
                                value={waypoint.remarks}
                                onChange={(e) => updateWaypoint(index, 'remarks', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Optional notes"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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

                {viewingRoute.waypoints && viewingRoute.waypoints.length > 0 && (
                  <div className="col-span-2 border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Multi-Point Delivery Stops ({viewingRoute.waypoints.length} waypoints)
                    </h4>
                    <div className="space-y-3">
                      {viewingRoute.waypoints.map((waypoint: any, index: number) => (
                        <div key={waypoint.waypoint_id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start gap-3">
                            <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                              {index + 1}
                            </span>
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">City</h5>
                                <p className="text-gray-900 font-medium">{waypoint.city_name}</p>
                              </div>
                              <div>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Stop Type</h5>
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {waypoint.stop_type}
                                </span>
                              </div>
                              <div>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Distance from Previous</h5>
                                <p className="text-gray-900">{waypoint.distance_from_previous_km} KM</p>
                              </div>
                              <div>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Time from Previous</h5>
                                <p className="text-gray-900">{waypoint.estimated_time_from_previous_hours} Hours</p>
                              </div>
                              {waypoint.remarks && (
                                <div className="col-span-2">
                                  <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Remarks</h5>
                                  <p className="text-gray-900 text-sm">{waypoint.remarks}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
