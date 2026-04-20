import { useEffect, useState } from 'react';
import { Plus, Search, Eye, CreditCard as Edit, X, Trash2, MapPin, RefreshCw, ScrollText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { TripModal } from '../components/trips/TripModal';
import { TripUpdateModal } from '../components/trips/TripUpdateModal';
import { LREntryModal } from '../components/trips/LREntryModal';

interface Trip {
  trip_id: string;
  trip_number: string;
  trip_type?: string;
  vehicle_id: string | null;
  vehicle_number_text?: string;
  driver_id: string | null;
  helper_name: string;
  route_id: string | null;
  customer_id: string | null;
  sales_person_id?: string | null;
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
  odometer_current?: number;
  enquiry_id?: string | null;
  vehicle?: { vehicle_number: string } | null;
  driver?: { driver_name: string } | null;
  customer?: { customer_name: string } | null;
  route?: { route_code: string } | null;
  enquiry?: { enquiry_id: string; enquiry_number: string } | null;
}

interface TripsListProps {
  convertEnquiryData?: any;
  editTripData?: any;
  onNavigate?: (page: string) => void;
}

export function TripsList({ convertEnquiryData, editTripData, onNavigate }: TripsListProps) {
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
  const [updateTrip, setUpdateTrip] = useState<Trip | null>(null);
  const [lrTrip, setLrTrip] = useState<Trip | null>(null);
  const { hasPermission, user } = useAuth();

  const canEdit = hasPermission('trips') || hasPermission('all');

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
          route:routes(route_code),
          enquiry:enquiries(enquiry_id, enquiry_number)
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
        supabase
          .from('vehicles')
          .select('vehicle_id, vehicle_number, vehicle_type_id, odometer_current, status, ownership_type, veh_cur_status, diesel_card_id, diesel_card:diesel_cards_master(card_name, card_number)')
          .order('vehicle_number'),
        supabase.from('drivers').select('driver_id, driver_name').order('driver_name'),
        supabase.from('routes').select('route_id, route_code, origin, destination, standard_distance_km, distance_google').order('route_code'),
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planned': return 'bg-blue-100 text-blue-800';
      case 'In Transit': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
                onClick={() => onNavigate?.('truck-arrival')}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">Loading...</td>
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
                      {trip.vehicle?.vehicle_number || trip.vehicle_number_text || (
                        <span className="text-gray-400 italic">Not Assigned</span>
                      )}
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
                        <button onClick={() => openViewModal(trip)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setLrTrip(trip)}
                          className="p-1 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                          title="LR Entry"
                        >
                          <ScrollText className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            {trip.trip_status === 'Planned' && (
                              <button
                                onClick={() => setUpdateTrip(trip)}
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                title="Update Trip"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => openEditModal(trip)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(trip.trip_id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
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
          onClose={() => { setShowModal(false); setEnquiryToConvert(null); }}
          onSuccess={() => { setShowModal(false); setEnquiryToConvert(null); loadTrips(); }}
        />
      )}

      {showCloseTripsModal && (
        <CloseTripsModal
          trips={trips.filter((t) => t.trip_status === 'In Transit')}
          onSelect={openCloseTripForm}
          onClose={() => setShowCloseTripsModal(false)}
        />
      )}

      {updateTrip && (
        <TripUpdateModal
          trip={updateTrip}
          drivers={drivers}
          userProfiles={userProfiles}
          vehicles={vehicles}
          customers={customers}
          onClose={() => setUpdateTrip(null)}
          onSuccess={() => { setUpdateTrip(null); loadTrips(); }}
        />
      )}

      {lrTrip && (
        <LREntryModal
          trip={lrTrip}
          driverName={lrTrip.driver?.driver_name || ''}
          vehicleName={lrTrip.vehicle?.vehicle_number || lrTrip.vehicle_number_text || ''}
          customerName={lrTrip.customer?.customer_name || ''}
          onClose={() => setLrTrip(null)}
        />
      )}
    </div>
  );
}

function CloseTripsModal({
  trips,
  onSelect,
  onClose,
}: {
  trips: Trip[];
  onSelect: (trip: Trip) => void;
  onClose: () => void;
}) {
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
                <div key={trip.trip_id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{trip.trip_number}</p>
                    <p className="text-sm text-gray-600">{trip.origin} → {trip.destination}</p>
                  </div>
                  <button onClick={() => onSelect(trip)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Close Trip">
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
