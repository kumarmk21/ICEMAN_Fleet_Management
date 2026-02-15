import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Edit, X, Trash2, GripVertical, MapPin, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { CityAutocomplete } from '../components/CityAutocomplete';

interface Trip {
  trip_id: string;
  trip_number: string;
  trip_type?: string;
  vehicle_id: string | null;
  vehicle_category?: string | null;
  driver_id: string | null;
  helper_name: string;
  route_id: string | null;
  customer_id: string | null;
  origin: string;
  destination: string;
  load_type?: string;
  planned_start_datetime: string | null;
  vehicle_placement_datetime: string | null;
  planned_end_datetime: string | null;
  actual_end_datetime: string | null;
  veh_departure: string | null;
  loading_tat_hrs: number;
  planned_distance_km: number;
  actual_distance_km: number;
  actual_distance_manual_km: number;
  freight_revenue: number;
  other_revenue: number;
  advance_to_driver: number;
  payment_mode_advance: string;
  trip_status: string;
  remarks: string;
  created_by: string | null;
  trip_closure: string | null;
  trip_closed_by: string | null;
  closing_odometer: number;
  vehicle?: { vehicle_number: string } | null;
  driver?: { driver_name: string } | null;
  customer?: { customer_name: string } | null;
  route?: { route_code: string } | null;
}

interface TripStop {
  trip_stop_id?: string;
  stop_sequence: number;
  stop_type: 'Pickup' | 'Drop';
  location: string;
  city_id?: string;
  load_type?: 'Reefer-Chilled' | 'Reefer-Ambient' | 'Dry' | 'Empty';
  planned_arrival_datetime?: string;
  actual_arrival_datetime?: string;
  planned_departure_datetime?: string;
  actual_departure_datetime?: string;
  contact_person?: string;
  contact_phone?: string;
  remarks?: string;
}

interface TripsListProps {
  convertEnquiryData?: any;
  editTripData?: any;
}

export function TripsList({ convertEnquiryData, editTripData }: TripsListProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit' | 'close'>('create');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [enquiryToConvert, setEnquiryToConvert] = useState<any>(null);
  const [showCloseTripsModal, setShowCloseTripsModal] = useState(false);
  const { hasPermission, user } = useAuth();

  const canEdit = true;

  useEffect(() => {
    loadTrips();
    loadMasterData();
  }, []);

  useEffect(() => {
    if (convertEnquiryData) {
      setEnquiryToConvert(convertEnquiryData);
      setModalMode('create');
      setSelectedTrip(null);
      setShowModal(true);
    }
  }, [convertEnquiryData]);

  useEffect(() => {
    if (editTripData) {
      setSelectedTrip(editTripData);
      setModalMode('edit');
      setEnquiryToConvert(null);
      setShowModal(true);
    }
  }, [editTripData]);

  async function loadTrips() {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          vehicle:vehicles(vehicle_number),
          driver:drivers(driver_name),
          customer:customers(customer_name),
          route:routes(route_code)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMasterData() {
    try {
      const [vehiclesRes, driversRes, routesRes, customersRes, profilesRes] = await Promise.all([
        supabase.from('vehicles').select('vehicle_id, vehicle_number, odometer_current, status, ownership_type').order('vehicle_number'),
        supabase.from('drivers').select('driver_id, driver_name').order('driver_name'),
        supabase.from('routes').select('route_id, route_code, origin, destination, standard_distance_km').order('route_code'),
        supabase.from('customers').select('customer_id, customer_name').order('customer_name'),
        supabase.from('user_profiles').select('user_id, full_name'),
      ]);

      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (driversRes.data) setDrivers(driversRes.data);
      if (routesRes.data) setRoutes(routesRes.data);
      if (customersRes.data) setCustomers(customersRes.data);
      if (profilesRes.data) setUserProfiles(profilesRes.data);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  }

  function openCreateModal() {
    setModalMode('create');
    setSelectedTrip(null);
    setEnquiryToConvert(null);
    setShowModal(true);
  }

  function openViewModal(trip: Trip) {
    setModalMode('view');
    setSelectedTrip(trip);
    setShowModal(true);
  }

  function openEditModal(trip: Trip) {
    setModalMode('edit');
    setSelectedTrip(trip);
    setShowModal(true);
  }

  function openCloseTripsModal() {
    setShowCloseTripsModal(true);
  }

  function openCloseTripForm(trip: Trip) {
    setModalMode('close');
    setSelectedTrip(trip);
    setShowModal(true);
    setShowCloseTripsModal(false);
  }

  async function handleDelete(tripId: string) {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      const { error } = await supabase.from('trips').delete().eq('trip_id', tripId);

      if (error) throw error;
      loadTrips();
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip');
    }
  }

  const filteredTrips = trips.filter((trip) => {
    const search = searchTerm.toLowerCase();
    return (
      trip.trip_number.toLowerCase().includes(search) ||
      trip.vehicle?.vehicle_number?.toLowerCase().includes(search) ||
      trip.driver?.driver_name?.toLowerCase().includes(search) ||
      trip.origin.toLowerCase().includes(search) ||
      trip.destination.toLowerCase().includes(search) ||
      trip.trip_status.toLowerCase().includes(search)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planned':
        return 'bg-blue-100 text-blue-800';
      case 'In Transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            {canEdit && (
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Trip
              </button>
            )}
            {canEdit && (
              <button
                onClick={openCloseTripsModal}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Close Trip
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trip #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No trips found. Create your first trip to get started.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip.trip_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{trip.trip_number}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {trip.vehicle?.vehicle_number || <span className="text-gray-400 italic">Not Assigned</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {trip.driver?.driver_name || <span className="text-gray-400 italic">Not Assigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600">{trip.origin} → {trip.destination}</span>
                        {trip.trip_type === 'Milk Run' && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                            <MapPin className="w-3 h-3" />
                            Milk Run
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(trip.trip_status)}`}>
                        {trip.trip_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(trip.freight_revenue + trip.other_revenue)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openViewModal(trip)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => openEditModal(trip)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(trip.trip_id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <TripModal
          mode={modalMode}
          trip={selectedTrip}
          enquiryToConvert={enquiryToConvert}
          vehicles={vehicles}
          drivers={drivers}
          routes={routes}
          customers={customers}
          userProfiles={userProfiles}
          user={user}
          onClose={() => {
            setShowModal(false);
            setEnquiryToConvert(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEnquiryToConvert(null);
            loadTrips();
          }}
        />
      )}

      {showCloseTripsModal && (
        <CloseTripsModal
          trips={trips.filter(t => t.trip_status === 'In Transit')}
          onSelect={openCloseTripForm}
          onClose={() => setShowCloseTripsModal(false)}
        />
      )}
    </div>
  );
}

interface TripModalProps {
  mode: 'create' | 'view' | 'edit' | 'close';
  trip: Trip | null;
  enquiryToConvert?: any;
  vehicles: any[];
  drivers: any[];
  routes: any[];
  customers: any[];
  userProfiles: any[];
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface CloseTripsModalProps {
  trips: Trip[];
  onSelect: (trip: Trip) => void;
  onClose: () => void;
}

function TripModal({ mode, trip, enquiryToConvert, vehicles, drivers, routes, customers, userProfiles, user, onClose, onSuccess }: TripModalProps) {
  const [tripType, setTripType] = useState<'adhoc' | 'enquiry'>(enquiryToConvert ? 'enquiry' : 'adhoc');
  const [availableEnquiries, setAvailableEnquiries] = useState<any[]>([]);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(enquiryToConvert?.enquiry_id || '');
  const [selectedEnquiryData, setSelectedEnquiryData] = useState(enquiryToConvert || null);
  const [vehicleType, setVehicleType] = useState<'Own' | 'Attached' | 'Market'>('Own');
  const [routeType, setRouteType] = useState<'Single' | 'Milk Run'>(trip?.trip_type === 'Milk Run' ? 'Milk Run' : 'Single');
  const [stops, setStops] = useState<TripStop[]>([]);
  const [fetchingDistance, setFetchingDistance] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: trip?.vehicle_id || '',
    vehicle_number_text: trip?.vehicle_number_text || '',
    vehicle_category: trip?.vehicle_category || '',
    driver_id: trip?.driver_id || '',
    helper_name: trip?.helper_name || '',
    route_id: trip?.route_id || '',
    customer_id: trip?.customer_id || enquiryToConvert?.customer_id || '',
    origin: trip?.origin || enquiryToConvert?.origin || '',
    destination: trip?.destination || enquiryToConvert?.destination || '',
    load_type: trip?.load_type || '',
    planned_start_datetime: trip?.planned_start_datetime?.slice(0, 16) || (enquiryToConvert?.loading_date ? new Date(enquiryToConvert.loading_date).toISOString().slice(0, 16) : ''),
    vehicle_placement_datetime: trip?.vehicle_placement_datetime?.slice(0, 16) || '',
    planned_end_datetime: trip?.planned_end_datetime?.slice(0, 16) || '',
    veh_departure: trip?.veh_departure?.slice(0, 16) || '',
    loading_tat_hrs: trip?.loading_tat_hrs || 0,
    planned_distance_km: trip?.planned_distance_km || 0,
    actual_distance_km: trip?.actual_distance_km || 0,
    actual_distance_manual_km: trip?.actual_distance_manual_km || 0,
    freight_revenue: trip?.freight_revenue || enquiryToConvert?.quoted_rate || 0,
    other_revenue: trip?.other_revenue || 0,
    advance_to_driver: trip?.advance_to_driver || 0,
    payment_mode_advance: trip?.payment_mode_advance || '',
    trip_status: trip?.trip_status || 'Planned',
    remarks: trip?.remarks || enquiryToConvert?.remarks || '',
    odometer_current: trip?.trip_id ? vehicles.find(v => v.vehicle_id === trip.vehicle_id)?.odometer_current || 0 : 0,
    diesel_card_info: '',
  });

  const [closeFormData, setCloseFormData] = useState({
    planned_end_datetime: trip?.planned_end_datetime?.slice(0, 16) || '',
    actual_end_datetime: trip?.actual_end_datetime?.slice(0, 16) || '',
    closing_odometer: trip?.closing_odometer || 0,
    trip_closed_by: trip?.trip_closed_by || user?.id || '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'create') {
      loadConvertedEnquiries();
    }
    if (trip && mode === 'edit') {
      loadTripStops(trip.trip_id);
    }
  }, [mode]);

  async function loadTripStops(tripId: string) {
    try {
      const { data, error } = await supabase
        .from('trip_stops')
        .select('*')
        .eq('trip_id', tripId)
        .order('stop_sequence');

      if (error) throw error;
      if (data && data.length > 0) {
        setStops(data.map(stop => ({
          ...stop,
          planned_arrival_datetime: stop.planned_arrival_datetime?.slice(0, 16),
          actual_arrival_datetime: stop.actual_arrival_datetime?.slice(0, 16),
          planned_departure_datetime: stop.planned_departure_datetime?.slice(0, 16),
          actual_departure_datetime: stop.actual_departure_datetime?.slice(0, 16),
        })));
      }
    } catch (error) {
      console.error('Error loading trip stops:', error);
    }
  }

  function addStop() {
    const newStop: TripStop = {
      stop_sequence: stops.length + 1,
      stop_type: 'Pickup',
      location: '',
    };
    setStops([...stops, newStop]);
  }

  function deleteStop(index: number) {
    const updatedStops = stops.filter((_, i) => i !== index);
    const resequenced = updatedStops.map((stop, i) => ({ ...stop, stop_sequence: i + 1 }));
    setStops(resequenced);
  }

  function moveStopUp(index: number) {
    if (index === 0) return;
    const newStops = [...stops];
    [newStops[index - 1], newStops[index]] = [newStops[index], newStops[index - 1]];
    const resequenced = newStops.map((stop, i) => ({ ...stop, stop_sequence: i + 1 }));
    setStops(resequenced);
  }

  function moveStopDown(index: number) {
    if (index === stops.length - 1) return;
    const newStops = [...stops];
    [newStops[index], newStops[index + 1]] = [newStops[index + 1], newStops[index]];
    const resequenced = newStops.map((stop, i) => ({ ...stop, stop_sequence: i + 1 }));
    setStops(resequenced);
  }

  function updateStop(index: number, field: keyof TripStop, value: any) {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setStops(newStops);
  }

  useEffect(() => {
    if (enquiryToConvert && !availableEnquiries.find(e => e.enquiry_id === enquiryToConvert.enquiry_id)) {
      setAvailableEnquiries(prev => [enquiryToConvert, ...prev]);
    }
  }, [enquiryToConvert, availableEnquiries]);

  useEffect(() => {
    if (formData.origin && formData.destination && routes.length > 0) {
      const matchingRoute = routes.find(
        (route) =>
          route.origin?.toLowerCase() === formData.origin.toLowerCase() &&
          route.destination?.toLowerCase() === formData.destination.toLowerCase()
      );

      if (matchingRoute && formData.route_id !== matchingRoute.route_id) {
        const distance = matchingRoute.distance_google && Number(matchingRoute.distance_google) > 0
          ? Number(matchingRoute.distance_google)
          : Number(matchingRoute.standard_distance_km || 0);

        setFormData((prev) => ({
          ...prev,
          route_id: matchingRoute.route_id,
          planned_distance_km: distance,
        }));
      }
    }
  }, [tripType, formData.origin, formData.destination, routes]);

  async function loadConvertedEnquiries() {
    try {
      const [enquiriesRes, tripsRes] = await Promise.all([
        supabase
          .from('enquiries')
          .select('*, customer:customers(customer_name)')
          .eq('status', 'Converted')
          .order('created_at', { ascending: false }),
        supabase
          .from('trips')
          .select('enquiry_id')
          .not('enquiry_id', 'is', null)
      ]);

      if (enquiriesRes.error) throw enquiriesRes.error;
      if (tripsRes.error) throw tripsRes.error;

      const usedEnquiryIds = new Set(tripsRes.data?.map(t => t.enquiry_id) || []);
      const availableEnquiriesData = enquiriesRes.data?.filter(
        e => !usedEnquiryIds.has(e.enquiry_id)
      ) || [];

      setAvailableEnquiries(availableEnquiriesData);
    } catch (error) {
      console.error('Error loading enquiries:', error);
    }
  }

  async function handleEnquirySelection(enquiryId: string) {
    setSelectedEnquiryId(enquiryId);
    const enquiry = availableEnquiries.find(e => e.enquiry_id === enquiryId);
    if (enquiry) {
      setSelectedEnquiryData(enquiry);
      const newFormData = {
        ...formData,
        customer_id: enquiry.customer_id || '',
        origin: enquiry.origin || '',
        destination: enquiry.destination || '',
        planned_start_datetime: enquiry.loading_date ? new Date(enquiry.loading_date).toISOString().slice(0, 16) : '',
        freight_revenue: enquiry.quoted_rate || 0,
        remarks: enquiry.remarks || '',
      };
      setFormData(newFormData);
    }
  }

  function handleTripTypeChange(type: 'adhoc' | 'enquiry') {
    setTripType(type);
    if (type === 'adhoc') {
      setSelectedEnquiryId('');
      setSelectedEnquiryData(null);
      setFormData({
        vehicle_id: '',
        vehicle_number_text: '',
        driver_id: '',
        helper_name: '',
        route_id: '',
        customer_id: '',
        origin: '',
        destination: '',
        planned_start_datetime: '',
        vehicle_placement_datetime: '',
        planned_end_datetime: '',
        veh_departure: '',
        loading_tat_hrs: 0,
        planned_distance_km: 0,
        actual_distance_km: 0,
        actual_distance_manual_km: 0,
        freight_revenue: 0,
        other_revenue: 0,
        advance_to_driver: 0,
        payment_mode_advance: '',
        trip_status: 'Planned',
        remarks: '',
        odometer_current: 0,
        diesel_card_info: '',
      });
    }
  }

  function handleRouteSelection(routeId: string) {
    const selectedRoute = routes.find(r => r.route_id === routeId);
    if (selectedRoute) {
      const distance = selectedRoute.distance_google && Number(selectedRoute.distance_google) > 0
        ? Number(selectedRoute.distance_google)
        : Number(selectedRoute.standard_distance_km || 0);

      setFormData(prev => ({
        ...prev,
        route_id: routeId,
        origin: selectedRoute.origin || prev.origin,
        destination: selectedRoute.destination || prev.destination,
        planned_distance_km: distance,
      }));
    } else {
      setFormData(prev => ({ ...prev, route_id: routeId }));
    }
  }

  async function calculateMilkRunDistance() {
    if (routeType !== 'Milk Run' || stops.length < 2) {
      alert('Please add at least 2 stops for Milk Run to calculate distance');
      return;
    }

    for (const stop of stops) {
      if (!stop.location || stop.location.trim() === '') {
        alert('Please fill in all stop locations before calculating distance');
        return;
      }
    }

    setFetchingDistance(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-distance`;

      const sortedStops = [...stops].sort((a, b) => a.stop_sequence - b.stop_sequence);
      let totalDistance = 0;

      for (let i = 0; i < sortedStops.length - 1; i++) {
        const origin = `${sortedStops[i].location}, India`;
        const destination = `${sortedStops[i + 1].location}, India`;

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

        if (data.distance_km) {
          totalDistance += data.distance_km;
        } else if (data.error) {
          alert(`Error fetching distance from ${origin} to ${destination}: ${data.error}`);
          setFetchingDistance(false);
          return;
        } else {
          alert(`Could not fetch distance from ${origin} to ${destination}. Please enter manually.`);
          setFetchingDistance(false);
          return;
        }
      }

      setFormData(prev => ({
        ...prev,
        planned_distance_km: totalDistance,
      }));

      alert(`Distance calculated successfully: ${totalDistance} km`);
    } catch (error) {
      console.error('Error fetching Google distance:', error);
      alert('Error fetching distance from Google Maps. Please enter manually.');
    } finally {
      setFetchingDistance(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === 'close') {
      await handleCloseTrip();
      return;
    }

    setSaving(true);

    try {
      if (routeType === 'Single' && !formData.route_id) {
        alert('Route is mandatory for Single Trip');
        setSaving(false);
        return;
      }

      if (!formData.actual_distance_km || formData.actual_distance_km <= 0) {
        alert('Actual Distance as Google is mandatory');
        setSaving(false);
        return;
      }

      if (!formData.actual_distance_manual_km || formData.actual_distance_manual_km <= 0) {
        alert('Actual Distance Manual (KM) is mandatory');
        setSaving(false);
        return;
      }

      if (routeType === 'Milk Run' && stops.length < 2) {
        alert('Milk Run trips must have at least 2 stops');
        setSaving(false);
        return;
      }

      if (routeType === 'Milk Run') {
        for (let i = 0; i < stops.length; i++) {
          if (!stops[i].location) {
            alert(`Stop ${i + 1}: Location is required`);
            setSaving(false);
            return;
          }
        }
      }

      const enquiryId = selectedEnquiryData?.enquiry_id || null;

      if (mode === 'create' && enquiryId) {
        const { data: existingTrips, error: checkError } = await supabase
          .from('trips')
          .select('trip_id')
          .eq('enquiry_id', enquiryId)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingTrips) {
          alert('This enquiry has already been converted to a trip. Each enquiry can only be used once.');
          setSaving(false);
          return;
        }
      }

      const { odometer_current, diesel_card_info, ...tripFormData } = formData;

      const originText = routeType === 'Milk Run' && stops.length > 0
        ? stops.filter(s => s.stop_type === 'Pickup').length > 0
          ? `Multi-stop: ${stops.filter(s => s.stop_type === 'Pickup').length} pickup(s)`
          : formData.origin
        : formData.origin;

      const destinationText = routeType === 'Milk Run' && stops.length > 0
        ? stops.filter(s => s.stop_type === 'Drop').length > 0
          ? `Multi-stop: ${stops.filter(s => s.stop_type === 'Drop').length} drop(s)`
          : formData.destination
        : formData.destination;

      const tripData = {
        ...tripFormData,
        trip_type: routeType,
        origin: originText,
        destination: destinationText,
        vehicle_id: formData.vehicle_id || null,
        driver_id: formData.driver_id || null,
        route_id: formData.route_id || null,
        customer_id: formData.customer_id || null,
        planned_start_datetime: formData.planned_start_datetime || null,
        vehicle_placement_datetime: formData.vehicle_placement_datetime || null,
        planned_end_datetime: formData.planned_end_datetime || null,
        veh_departure: formData.veh_departure || null,
        loading_tat_hrs: formData.loading_tat_hrs || 0,
        enquiry_id: enquiryId,
        created_by: mode === 'create' ? user?.id : undefined,
      };

      console.log('Attempting to save trip with data:', tripData);

      if (mode === 'create') {
        const { data, error } = await supabase.from('trips').insert([tripData]).select();
        console.log('Insert result:', { data, error });
        if (error) throw error;

        if (data && data[0] && routeType === 'Milk Run' && stops.length > 0) {
          const tripId = data[0].trip_id;
          const stopsToInsert = stops.map(stop => ({
            trip_id: tripId,
            stop_sequence: stop.stop_sequence,
            stop_type: stop.stop_type,
            location: stop.location,
            city_id: stop.city_id || null,
            load_type: stop.load_type || null,
            planned_arrival_datetime: stop.planned_arrival_datetime || null,
            actual_arrival_datetime: stop.actual_arrival_datetime || null,
            planned_departure_datetime: stop.planned_departure_datetime || null,
            actual_departure_datetime: stop.actual_departure_datetime || null,
            contact_person: stop.contact_person || null,
            contact_phone: stop.contact_phone || null,
            remarks: stop.remarks || null,
          }));

          const { error: stopsError } = await supabase
            .from('trip_stops')
            .insert(stopsToInsert);

          if (stopsError) {
            console.error('Error saving trip stops:', stopsError);
            alert('Trip created but failed to save stops');
          }
        }

        if (enquiryId) {
          const { error: updateError } = await supabase
            .from('enquiries')
            .update({
              status: 'Converted',
              trip_status: 'Planned'
            })
            .eq('enquiry_id', enquiryId);
          if (updateError) {
            console.error('Error updating enquiry status:', updateError);
          }
        }
      } else if (mode === 'edit' && trip) {
        const { error } = await supabase
          .from('trips')
          .update(tripData)
          .eq('trip_id', trip.trip_id);
        if (error) throw error;

        if (routeType === 'Milk Run') {
          await supabase.from('trip_stops').delete().eq('trip_id', trip.trip_id);

          if (stops.length > 0) {
            const stopsToInsert = stops.map(stop => ({
              trip_id: trip.trip_id,
              stop_sequence: stop.stop_sequence,
              stop_type: stop.stop_type,
              location: stop.location,
              city_id: stop.city_id || null,
              load_type: stop.load_type || null,
              planned_arrival_datetime: stop.planned_arrival_datetime || null,
              actual_arrival_datetime: stop.actual_arrival_datetime || null,
              planned_departure_datetime: stop.planned_departure_datetime || null,
              actual_departure_datetime: stop.actual_departure_datetime || null,
              contact_person: stop.contact_person || null,
              contact_phone: stop.contact_phone || null,
              remarks: stop.remarks || null,
            }));

            const { error: stopsError } = await supabase
              .from('trip_stops')
              .insert(stopsToInsert);

            if (stopsError) {
              console.error('Error saving trip stops:', stopsError);
              alert('Trip updated but failed to save stops');
            }
          }
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving trip:', error);
      alert(`Failed to save trip: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleCloseTrip() {
    if (!trip) return;
    setSaving(true);

    try {
      const openingOdometer = formData.odometer_current || 0;
      const plannedDistance = formData.planned_distance_km || 0;

      if (!closeFormData.closing_odometer || closeFormData.closing_odometer <= 0) {
        alert('Closing Odometer is mandatory');
        setSaving(false);
        return;
      }

      if (closeFormData.closing_odometer < openingOdometer) {
        alert(`Closing Odometer (${closeFormData.closing_odometer}) cannot be less than Opening Odometer (${openingOdometer})`);
        setSaving(false);
        return;
      }

      const minDistance = plannedDistance * 0.80;
      const maxDistance = plannedDistance * 1.20;
      const minAllowed = openingOdometer + minDistance;
      const maxAllowed = openingOdometer + maxDistance;

      if (closeFormData.closing_odometer < minAllowed || closeFormData.closing_odometer > maxAllowed) {
        const minRounded = Math.round(minAllowed * 100) / 100;
        const maxRounded = Math.round(maxAllowed * 100) / 100;
        alert(`Closing Odometer must be within ±20% of planned distance.\nPlanned distance: ${plannedDistance.toFixed(2)} KM (80%-120% = ${minDistance.toFixed(2)} - ${maxDistance.toFixed(2)} KM)\nAllowed closing range: ${minRounded} - ${maxRounded} KM\nEntered: ${closeFormData.closing_odometer} KM`);
        setSaving(false);
        return;
      }

      if (!closeFormData.planned_end_datetime) {
        alert('Planned End Date/Time is mandatory');
        setSaving(false);
        return;
      }

      if (!closeFormData.actual_end_datetime) {
        alert('Actual End Date/Time is mandatory');
        setSaving(false);
        return;
      }

      const userFullName = userProfiles.find(p => p.user_id === closeFormData.trip_closed_by)?.full_name || 'Unknown';

      const odometer_start = trip.odometer_current || formData.odometer_current || 0;
      const actual_distance = closeFormData.closing_odometer - odometer_start;

      const tripData = {
        planned_end_datetime: closeFormData.planned_end_datetime ? new Date(closeFormData.planned_end_datetime).toISOString() : null,
        actual_end_datetime: closeFormData.actual_end_datetime ? new Date(closeFormData.actual_end_datetime).toISOString() : null,
        closing_odometer: closeFormData.closing_odometer,
        actual_distance_km: actual_distance > 0 ? actual_distance : formData.actual_distance_km,
        trip_closed_by: userFullName,
        trip_closure: new Date().toISOString(),
        trip_status: 'Closed',
      };

      const { error: tripError } = await supabase
        .from('trips')
        .update(tripData)
        .eq('trip_id', trip.trip_id);

      if (tripError) throw tripError;

      if (trip.vehicle_id) {
        const selectedVehicle = vehicles.find(v => v.vehicle_id === trip.vehicle_id);
        if (selectedVehicle && (selectedVehicle.ownership_type === 'Owned' || selectedVehicle.ownership_type === 'Attached')) {
          const { error: vehicleError } = await supabase
            .from('vehicles')
            .update({
              odometer_current: closeFormData.closing_odometer,
              status: 'Active',
            })
            .eq('vehicle_id', trip.vehicle_id);

          if (vehicleError) throw vehicleError;
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error closing trip:', error);
      alert('Failed to close trip');
    } finally {
      setSaving(false);
    }
  }

  const isViewMode = mode === 'view';
  const isCloseMode = mode === 'close';
  const title = isCloseMode ? 'Close Trip' : mode === 'create' ? 'Create Trip' : mode === 'edit' ? 'Edit Trip' : 'View Trip';

  const ownershipTypeMap = {
    'Own': 'Owned',
    'Attached': 'Attached',
    'Market': 'Market Vehicle'
  };

  const filteredVehicles = vehicleType === 'Market'
    ? []
    : vehicles.filter(v => v.ownership_type === ownershipTypeMap[vehicleType]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {isCloseMode && trip && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm text-blue-800">
                    Trip: <strong>{trip.trip_number}</strong>
                  </p>
                  <p className="text-sm text-blue-800">
                    Route: <strong>{trip.origin} → {trip.destination}</strong>
                  </p>
                  <p className="text-sm text-blue-800">
                    Trip ID: <strong>{trip.trip_id}</strong>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Closed By *</label>
                <select
                  value={closeFormData.trip_closed_by}
                  onChange={(e) => setCloseFormData({ ...closeFormData, trip_closed_by: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select user</option>
                  {userProfiles.map((profile) => (
                    <option key={profile.user_id} value={profile.user_id}>
                      {profile.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Planned End Date/Time *</label>
                <input
                  type="datetime-local"
                  value={closeFormData.planned_end_datetime}
                  onChange={(e) => setCloseFormData({ ...closeFormData, planned_end_datetime: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual End Date/Time *</label>
                <input
                  type="datetime-local"
                  value={closeFormData.actual_end_datetime}
                  onChange={(e) => setCloseFormData({ ...closeFormData, actual_end_datetime: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opening Odometer (KM)</label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium">
                    {formData.odometer_current}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closing Odometer (KM) *</label>
                  {(() => {
                    const openingOdometer = formData.odometer_current || 0;
                    const plannedDistance = formData.planned_distance_km || 0;
                    const minDistance = plannedDistance * 0.80;
                    const maxDistance = plannedDistance * 1.20;
                    const minAllowed = openingOdometer + minDistance;
                    const maxAllowed = openingOdometer + maxDistance;
                    const isOutOfRange = closeFormData.closing_odometer > 0 &&
                      (closeFormData.closing_odometer < minAllowed || closeFormData.closing_odometer > maxAllowed);
                    const isLessThanOpening = closeFormData.closing_odometer > 0 && closeFormData.closing_odometer < openingOdometer;

                    return (
                      <>
                        <input
                          type="number"
                          step="0.01"
                          value={closeFormData.closing_odometer}
                          onChange={(e) => setCloseFormData({ ...closeFormData, closing_odometer: Number(e.target.value) })}
                          required
                          placeholder="Enter closing odometer reading"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isLessThanOpening || isOutOfRange
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          }`}
                        />
                        {isLessThanOpening && (
                          <p className="text-red-600 text-xs mt-1">Closing odometer cannot be less than opening odometer</p>
                        )}
                        {isOutOfRange && !isLessThanOpening && (
                          <p className="text-red-600 text-xs mt-1">Must be within ±20% of planned distance ({minDistance.toFixed(2)} - {maxDistance.toFixed(2)} KM)</p>
                        )}
                        <p className="text-gray-500 text-xs mt-2">Allowed range (Opening + Planned ±20%): {Math.round(minAllowed * 100) / 100} - {Math.round(maxAllowed * 100) / 100} KM</p>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Trip #</p>
                  <p className="font-medium text-gray-900">{trip.trip_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <p className="font-medium text-gray-900">{trip.trip_status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Starting Odometer</p>
                  <p className="font-medium text-gray-900">{formData.odometer_current} KM</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Planned Distance</p>
                  <p className="font-medium text-gray-900">{trip.planned_distance_km} KM</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Current Actual Distance</p>
                  <p className="font-medium text-gray-900">{trip.actual_distance_km} KM</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Calculated Distance</p>
                  <p className="font-medium text-gray-900">{Math.max(0, closeFormData.closing_odometer - (formData.odometer_current || 0))} KM</p>
                </div>
              </div>
            </div>
          )}

          {mode !== 'close' && (
            <>
              {mode === 'create' && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Trip Type</label>
                    <div className="flex gap-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="tripType"
                          value="adhoc"
                          checked={tripType === 'adhoc'}
                          onChange={() => handleTripTypeChange('adhoc')}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Ad Hoc</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="tripType"
                          value="enquiry"
                          checked={tripType === 'enquiry'}
                          onChange={() => handleTripTypeChange('enquiry')}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Enquiry</span>
                      </label>
                    </div>
                  </div>

                  {tripType === 'enquiry' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Enquiry *</label>
                      <select
                        value={selectedEnquiryId}
                        onChange={(e) => handleEnquirySelection(e.target.value)}
                        required={tripType === 'enquiry'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select an enquiry</option>
                        {availableEnquiries.map((enquiry) => (
                          <option key={enquiry.enquiry_id} value={enquiry.enquiry_id}>
                            {enquiry.enquiry_number} - {enquiry.customer?.customer_name} - {enquiry.origin} → {enquiry.destination}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Vehicle Type</label>
                    <div className="flex gap-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="vehicleType"
                          value="Own"
                          checked={vehicleType === 'Own'}
                          onChange={() => {
                            setVehicleType('Own');
                            setFormData({ ...formData, vehicle_id: '', vehicle_number_text: '', odometer_current: 0, diesel_card_info: '' });
                          }}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Own</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="vehicleType"
                          value="Attached"
                          checked={vehicleType === 'Attached'}
                          onChange={() => {
                            setVehicleType('Attached');
                            setFormData({ ...formData, vehicle_id: '', vehicle_number_text: '', odometer_current: 0, diesel_card_info: '' });
                          }}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Attached</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="vehicleType"
                          value="Market"
                          checked={vehicleType === 'Market'}
                          onChange={() => {
                            setVehicleType('Market');
                            setFormData({ ...formData, vehicle_id: '', vehicle_number_text: '', odometer_current: 0, vehicle_category: '', diesel_card_info: '' });
                          }}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Market</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  {vehicleType === 'Market' ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                      <input
                        type="text"
                        value={formData.vehicle_number_text}
                        onChange={(e) => setFormData({ ...formData, vehicle_number_text: e.target.value })}
                        disabled={isViewMode}
                        required
                        placeholder="Enter vehicle number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                      <select
                        value={formData.vehicle_id}
                        onChange={(e) => {
                          const selectedVehicle = filteredVehicles.find(v => v.vehicle_id === e.target.value);
                          setFormData({
                            ...formData,
                            vehicle_id: e.target.value,
                            vehicle_category: '',
                            odometer_current: selectedVehicle?.odometer_current || 0,
                            diesel_card_info: '',
                          });
                        }}
                        disabled={isViewMode}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Select Vehicle</option>
                        {filteredVehicles.map((vehicle) => (
                          <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                            {vehicle.vehicle_number}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odometer (KM)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.odometer_current}
                    onChange={(e) => setFormData({ ...formData, odometer_current: Number(e.target.value) })}
                    disabled={isViewMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver *</label>
              <select
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                disabled={isViewMode}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Driver</option>
                {drivers.map((driver) => (
                  <option key={driver.driver_id} value={driver.driver_id}>
                    {driver.driver_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Helper Name</label>
              <input
                type="text"
                value={formData.helper_name}
                onChange={(e) => setFormData({ ...formData, helper_name: e.target.value })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                disabled={isViewMode}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.customer_id} value={customer.customer_id}>
                    {customer.customer_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-3">Route Type *</label>
              <div className="flex gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="routeType"
                    value="Single"
                    checked={routeType === 'Single'}
                    onChange={() => {
                      setRouteType('Single');
                      setStops([]);
                    }}
                    disabled={isViewMode}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Single Trip (Point A to Point B)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="routeType"
                    value="Milk Run"
                    checked={routeType === 'Milk Run'}
                    onChange={() => {
                      setRouteType('Milk Run');
                      setFormData(prev => ({ ...prev, route_id: '' }));
                      if (stops.length === 0) {
                        setStops([
                          { stop_sequence: 1, stop_type: 'Pickup', location: '' },
                          { stop_sequence: 2, stop_type: 'Drop', location: '' },
                        ]);
                      }
                    }}
                    disabled={isViewMode}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Milk Run (Multiple Pickups/Drops)</span>
                </label>
              </div>
            </div>

            {routeType === 'Single' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label>
                  <CityAutocomplete
                    value={formData.origin}
                    onChange={(value) => setFormData({ ...formData, origin: value })}
                    disabled={isViewMode}
                    required
                    placeholder="Search origin city..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                  <CityAutocomplete
                    value={formData.destination}
                    onChange={(value) => setFormData({ ...formData, destination: value })}
                    disabled={isViewMode}
                    required
                    placeholder="Search destination city..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Load Type</label>
                  <select
                    value={formData.load_type}
                    onChange={(e) => setFormData({ ...formData, load_type: e.target.value })}
                    disabled={isViewMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Load Type</option>
                    <option value="Reefer-Chilled">Reefer-Chilled</option>
                    <option value="Reefer-Ambient">Reefer-Ambient</option>
                    <option value="Dry">Dry</option>
                    <option value="Empty">Empty</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Trip Stops *</label>
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={addStop}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Stop
                    </button>
                  )}
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {stops.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No stops added. Add at least 2 stops for milk run trip.</p>
                  ) : (
                    stops.map((stop, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1 pt-2">
                            <MapPin className={`w-5 h-5 ${stop.stop_type === 'Pickup' ? 'text-green-600' : 'text-blue-600'}`} />
                            {!isViewMode && (
                              <div className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveStopUp(index)}
                                  disabled={index === 0}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                  title="Move up"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveStopDown(index)}
                                  disabled={index === stops.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                  title="Move down"
                                >
                                  <GripVertical className="w-4 h-4 rotate-180" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Stop #{stop.stop_sequence} - Type *
                              </label>
                              <select
                                value={stop.stop_type}
                                onChange={(e) => updateStop(index, 'stop_type', e.target.value)}
                                disabled={isViewMode}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                              >
                                <option value="Pickup">Pickup</option>
                                <option value="Drop">Drop</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Location *</label>
                              <CityAutocomplete
                                value={stop.location}
                                onChange={(value) => updateStop(index, 'location', value)}
                                disabled={isViewMode}
                                placeholder="Search city..."
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Load Type</label>
                              <select
                                value={stop.load_type || ''}
                                onChange={(e) => updateStop(index, 'load_type', e.target.value)}
                                disabled={isViewMode}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                              >
                                <option value="">Select Load Type</option>
                                <option value="Reefer-Chilled">Reefer-Chilled</option>
                                <option value="Reefer-Ambient">Reefer-Ambient</option>
                                <option value="Dry">Dry</option>
                                <option value="Empty">Empty</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Person</label>
                              <input
                                type="text"
                                value={stop.contact_person || ''}
                                onChange={(e) => updateStop(index, 'contact_person', e.target.value)}
                                disabled={isViewMode}
                                placeholder="Contact name"
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
                              <input
                                type="text"
                                value={stop.contact_phone || ''}
                                onChange={(e) => updateStop(index, 'contact_phone', e.target.value)}
                                disabled={isViewMode}
                                placeholder="Phone number"
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                              <input
                                type="text"
                                value={stop.remarks || ''}
                                onChange={(e) => updateStop(index, 'remarks', e.target.value)}
                                disabled={isViewMode}
                                placeholder="Any notes"
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                              />
                            </div>
                          </div>

                          {!isViewMode && (
                            <button
                              type="button"
                              onClick={() => deleteStop(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete stop"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route{routeType === 'Single' && ' *'}
              </label>
              <select
                value={formData.route_id}
                onChange={(e) => handleRouteSelection(e.target.value)}
                disabled={isViewMode || routeType === 'Milk Run'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Route</option>
                {routes.map((route) => (
                  <option key={route.route_id} value={route.route_id}>
                    {route.route_code} ({route.origin} → {route.destination})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned Distance (KM)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={formData.planned_distance_km}
                  onChange={(e) =>
                    setFormData({ ...formData, planned_distance_km: Number(e.target.value) })
                  }
                  disabled={isViewMode}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
                {routeType === 'Milk Run' && !isViewMode && (
                  <button
                    type="button"
                    onClick={calculateMilkRunDistance}
                    disabled={fetchingDistance || stops.length < 2}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    {fetchingDistance ? 'Calculating...' : 'Calculate'}
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Distance as Google *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.actual_distance_km}
                onChange={(e) =>
                  setFormData({ ...formData, actual_distance_km: Number(e.target.value) })
                }
                disabled={isViewMode}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Distance Manual (KM) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.actual_distance_manual_km}
                onChange={(e) =>
                  setFormData({ ...formData, actual_distance_manual_km: Number(e.target.value) })
                }
                disabled={isViewMode}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned Start Date/Time *
              </label>
              <input
                type="datetime-local"
                value={formData.planned_start_datetime}
                onChange={(e) => setFormData({ ...formData, planned_start_datetime: e.target.value })}
                disabled={isViewMode}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Placement Date/Time *
              </label>
              <input
                type="datetime-local"
                value={formData.vehicle_placement_datetime}
                onChange={(e) => {
                  const newPlacementDateTime = e.target.value;
                  let loadingTatHrs = formData.loading_tat_hrs;

                  if (newPlacementDateTime && formData.veh_departure) {
                    const placementTime = new Date(newPlacementDateTime).getTime();
                    const departureTime = new Date(formData.veh_departure).getTime();
                    loadingTatHrs = Number(((departureTime - placementTime) / (1000 * 60 * 60)).toFixed(2));
                  }

                  setFormData({
                    ...formData,
                    vehicle_placement_datetime: newPlacementDateTime,
                    loading_tat_hrs: loadingTatHrs
                  });
                }}
                disabled={isViewMode}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned End Date/Time *
              </label>
              <input
                type="datetime-local"
                value={formData.planned_end_datetime}
                onChange={(e) => setFormData({ ...formData, planned_end_datetime: e.target.value })}
                disabled={isViewMode}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Veh Departure Date/Time
              </label>
              <input
                type="datetime-local"
                value={formData.veh_departure}
                onChange={(e) => {
                  const newVehDeparture = e.target.value;
                  let loadingTatHrs = formData.loading_tat_hrs;

                  if (newVehDeparture && formData.vehicle_placement_datetime) {
                    const placementTime = new Date(formData.vehicle_placement_datetime).getTime();
                    const departureTime = new Date(newVehDeparture).getTime();
                    loadingTatHrs = Number(((departureTime - placementTime) / (1000 * 60 * 60)).toFixed(2));
                  }

                  setFormData({
                    ...formData,
                    veh_departure: newVehDeparture,
                    loading_tat_hrs: loadingTatHrs,
                    trip_status: newVehDeparture ? 'In Transit' : formData.trip_status
                  });
                }}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              {formData.veh_departure && (
                <p className="text-xs text-green-600 mt-1">
                  Status will be set to 'In Transit'
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loading TAT in Hrs
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.loading_tat_hrs}
                onChange={(e) => setFormData({ ...formData, loading_tat_hrs: parseFloat(e.target.value) || 0 })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Calculated automatically from placement to departure"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Freight Revenue (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.freight_revenue}
                onChange={(e) =>
                  setFormData({ ...formData, freight_revenue: Number(e.target.value) })
                }
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Revenue (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.other_revenue}
                onChange={(e) =>
                  setFormData({ ...formData, other_revenue: Number(e.target.value) })
                }
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance to Driver (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.advance_to_driver}
                onChange={(e) =>
                  setFormData({ ...formData, advance_to_driver: Number(e.target.value) })
                }
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diesel Card</label>
              <input
                type="text"
                value={formData.diesel_card_info}
                disabled
                placeholder="Auto-populated from vehicle"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Category</label>
              <input
                type="text"
                value={formData.vehicle_category}
                disabled
                placeholder="Auto-populated from vehicle"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.trip_status}
                onChange={(e) => setFormData({ ...formData, trip_status: e.target.value })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="Planned">Planned</option>
                <option value="In Transit">In Transit</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                disabled={isViewMode}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && (
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-400"
              >
                {saving ? 'Saving...' : isCloseMode ? 'Close Trip' : mode === 'create' ? 'Create' : 'Update'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function CloseTripsModal({ trips, onSelect, onClose }: CloseTripsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Close Trip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {trips.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No trips in transit to close</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip.trip_id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{trip.trip_number}</p>
                    <p className="text-sm text-gray-600">
                      {trip.origin} → {trip.destination}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelect(trip)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Close Trip"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
