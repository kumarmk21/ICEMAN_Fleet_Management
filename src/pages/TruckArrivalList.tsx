import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Truck,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { TruckArrivalModal } from '../components/trips/TruckArrivalModal';
import type { ArrivalTrip } from '../components/trips/TruckArrivalModal';

const PAGE_SIZE = 20;

export function TruckArrivalList() {
  const [trips, setTrips] = useState<ArrivalTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTrip, setSelectedTrip] = useState<ArrivalTrip | null>(null);
  const { hasPermission } = useAuth();

  const canEdit = hasPermission('truck-arrival') || hasPermission('all');

  const loadTrips = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          trip_id,
          trip_number,
          vehicle_id,
          vehicle_number_text,
          driver_id,
          origin,
          destination,
          trip_status,
          veh_departure,
          planned_end_datetime,
          estimated_report_datetime,
          opening_odometer,
          closing_odometer,
          vehicle:vehicles(vehicle_number),
          driver:drivers(driver_name),
          customer:customers(customer_name),
          route:routes(route_code)
        `)
        .like('trip_status', 'In Transit%')
        .order('veh_departure', { ascending: false });

      if (error) throw error;
      setTrips((data as unknown as ArrivalTrip[]) || []);
    } catch (err) {
      console.error('Error loading in-transit trips:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const filtered = trips.filter((t) => {
    const s = searchTerm.toLowerCase();
    return (
      t.trip_number.toLowerCase().includes(s) ||
      (t.vehicle?.vehicle_number ?? '').toLowerCase().includes(s) ||
      (t.vehicle_number_text ?? '').toLowerCase().includes(s) ||
      (t.driver?.driver_name ?? '').toLowerCase().includes(s) ||
      t.origin.toLowerCase().includes(s) ||
      t.destination.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(value: string) {
    setSearchTerm(value);
    setPage(1);
  }

  const formatDateTime = (dt: string | null) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-IN', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const getEtaStatus = (eta: string | null) => {
    if (!eta) return null;
    const diff = new Date(eta).getTime() - Date.now();
    const hours = diff / 3_600_000;
    if (hours < 0) return { label: 'Overdue', cls: 'text-red-600 bg-red-50 border-red-200' };
    if (hours < 4) return { label: 'Due Soon', cls: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'On Track', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by trip, vehicle, driver, or route..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <Truck className="w-4 h-4 text-amber-600" />
              <span className="text-[13px] font-semibold text-amber-700">{trips.length}</span>
              <span className="text-[12px] text-amber-600">In Transit</span>
            </div>
            <button
              onClick={() => loadTrips(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Trip #
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Departed
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  ETA
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-[13px]">Loading in-transit trips...</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Truck className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-600">
                          {searchTerm ? 'No matching trips found' : 'No trucks currently in transit'}
                        </p>
                        <p className="text-[12px] text-gray-400 mt-1">
                          {searchTerm
                            ? 'Try adjusting your search terms'
                            : 'All trips are up to date'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((trip) => {
                  const eta = getEtaStatus(trip.planned_end_datetime);
                  return (
                    <tr key={trip.trip_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-[13px] font-semibold text-gray-900">
                          {trip.trip_number}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-[13px] text-gray-700">
                            {trip.vehicle?.vehicle_number || trip.vehicle_number_text || (
                              <span className="text-gray-400 italic text-[12px]">Not Assigned</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-gray-700">
                        {trip.driver?.driver_name || (
                          <span className="text-gray-400 italic text-[12px]">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-[13px] text-gray-600">{trip.origin}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-[13px] font-medium text-gray-800">{trip.destination}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-[13px] text-gray-600">
                            {formatDateTime(trip.veh_departure)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {trip.planned_end_datetime ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[13px] text-gray-600">
                              {formatDateTime(trip.planned_end_datetime)}
                            </span>
                            {eta && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border w-fit ${eta.cls}`}
                              >
                                {eta.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[12px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {canEdit ? (
                          <button
                            onClick={() => setSelectedTrip(trip)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Arrival
                          </button>
                        ) : (
                          <span className="text-[12px] text-gray-400">No access</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-[12px] text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length} trips
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-[12px] font-medium text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Arrival Modal */}
      {selectedTrip && (
        <TruckArrivalModal
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onSuccess={() => {
            setSelectedTrip(null);
            loadTrips(true);
          }}
        />
      )}
    </div>
  );
}
