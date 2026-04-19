import { useEffect, useState } from 'react';
import {
  X, Plus, Trash2, GripVertical, MapPin, Navigation,
  User, Truck, Route, Package, Eye, EyeOff,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CityAutocomplete } from '../CityAutocomplete';
import { SearchableSelect } from './SearchableSelect';

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

interface TripModalProps {
  mode: 'create' | 'view' | 'edit' | 'close';
  trip: any | null;
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

export function TripModal({
  mode,
  trip,
  enquiryToConvert,
  vehicles,
  drivers,
  routes,
  customers,
  userProfiles,
  user,
  onClose,
  onSuccess,
}: TripModalProps) {
  const [availableEnquiries, setAvailableEnquiries] = useState<any[]>([]);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(enquiryToConvert?.enquiry_id || '');
  const [selectedEnquiryData, setSelectedEnquiryData] = useState<any>(enquiryToConvert || null);
  const [vehicleType, setVehicleType] = useState<'Own' | 'Attached' | 'Market'>('Own');
  const [routeType, setRouteType] = useState<'Single' | 'Milk Run'>(
    trip?.trip_type === 'Milk Run' ? 'Milk Run' : 'Single'
  );
  const [stops, setStops] = useState<TripStop[]>([]);
  const [fetchingDistance, setFetchingDistance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFreightRevenue, setShowFreightRevenue] = useState(false);

  const [formData, setFormData] = useState({
    sales_person_id: trip?.sales_person_id || '',
    vehicle_id: trip?.vehicle_id || '',
    vehicle_number_text: trip?.vehicle_number_text || '',
    driver_id: trip?.driver_id || '',
    helper_name: trip?.helper_name || '',
    route_id: trip?.route_id || '',
    customer_id: trip?.customer_id || enquiryToConvert?.customer_id || '',
    origin: trip?.origin || enquiryToConvert?.origin || '',
    destination: trip?.destination || enquiryToConvert?.destination || '',
    load_type: trip?.load_type || enquiryToConvert?.load_type || '',
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
    odometer_current: trip?.trip_id ? vehicles.find((v) => v.vehicle_id === trip.vehicle_id)?.odometer_current || 0 : 0,
  });

  const [closeFormData, setCloseFormData] = useState({
    planned_end_datetime: trip?.planned_end_datetime?.slice(0, 16) || '',
    actual_end_datetime: trip?.actual_end_datetime?.slice(0, 16) || '',
    closing_odometer: trip?.closing_odometer || 0,
    trip_closed_by: trip?.trip_closed_by || user?.id || '',
  });

  useEffect(() => {
    if (mode === 'create') loadAvailableEnquiries();
    if (trip && mode === 'edit') loadTripStops(trip.trip_id);
  }, [mode]);

  useEffect(() => {
    if (enquiryToConvert && !availableEnquiries.find((e) => e.enquiry_id === enquiryToConvert.enquiry_id)) {
      setAvailableEnquiries((prev) => [enquiryToConvert, ...prev]);
    }
  }, [enquiryToConvert, availableEnquiries]);

  useEffect(() => {
    if (formData.origin && formData.destination && routes.length > 0) {
      const matchingRoute = routes.find(
        (r) =>
          r.origin?.toLowerCase() === formData.origin.toLowerCase() &&
          r.destination?.toLowerCase() === formData.destination.toLowerCase()
      );
      if (matchingRoute && formData.route_id !== matchingRoute.route_id) {
        const distance =
          matchingRoute.distance_google && Number(matchingRoute.distance_google) > 0
            ? Number(matchingRoute.distance_google)
            : Number(matchingRoute.standard_distance_km || 0);
        setFormData((prev) => ({
          ...prev,
          route_id: matchingRoute.route_id,
          planned_distance_km: distance,
        }));
      }
    }
  }, [formData.origin, formData.destination, routes]);

  async function loadTripStops(tripId: string) {
    try {
      const { data, error } = await supabase
        .from('trip_stops')
        .select('*')
        .eq('trip_id', tripId)
        .order('stop_sequence');
      if (error) throw error;
      if (data && data.length > 0) {
        setStops(
          data.map((s) => ({
            ...s,
            planned_arrival_datetime: s.planned_arrival_datetime?.slice(0, 16),
            actual_arrival_datetime: s.actual_arrival_datetime?.slice(0, 16),
            planned_departure_datetime: s.planned_departure_datetime?.slice(0, 16),
            actual_departure_datetime: s.actual_departure_datetime?.slice(0, 16),
          }))
        );
      }
    } catch (error) {
      console.error('Error loading trip stops:', error);
    }
  }

  async function loadAvailableEnquiries() {
    try {
      const [enquiriesRes, tripsRes] = await Promise.all([
        supabase
          .from('enquiries')
          .select('*, customer:customers(customer_name)')
          .eq('status', 'Converted')
          .order('created_at', { ascending: false }),
        supabase.from('trips').select('enquiry_id').not('enquiry_id', 'is', null),
      ]);
      if (enquiriesRes.error) throw enquiriesRes.error;
      if (tripsRes.error) throw tripsRes.error;
      const usedIds = new Set(tripsRes.data?.map((t) => t.enquiry_id) || []);
      setAvailableEnquiries(enquiriesRes.data?.filter((e) => !usedIds.has(e.enquiry_id)) || []);
    } catch (error) {
      console.error('Error loading enquiries:', error);
    }
  }

  function handleEnquirySelection(enquiryId: string) {
    setSelectedEnquiryId(enquiryId);
    const enquiry = availableEnquiries.find((e) => e.enquiry_id === enquiryId);
    if (enquiry) {
      setSelectedEnquiryData(enquiry);
      setFormData((prev) => ({
        ...prev,
        customer_id: enquiry.customer_id || '',
        origin: enquiry.origin || '',
        destination: enquiry.destination || '',
        load_type: enquiry.load_type || '',
        planned_start_datetime: enquiry.loading_date
          ? new Date(enquiry.loading_date).toISOString().slice(0, 16)
          : '',
        freight_revenue: enquiry.quoted_rate || 0,
        remarks: enquiry.remarks || '',
      }));
    } else {
      setSelectedEnquiryData(null);
    }
  }

  function handleRouteSelection(routeId: string) {
    const sel = routes.find((r) => r.route_id === routeId);
    if (sel) {
      const distance =
        sel.distance_google && Number(sel.distance_google) > 0
          ? Number(sel.distance_google)
          : Number(sel.standard_distance_km || 0);
      setFormData((prev) => ({
        ...prev,
        route_id: routeId,
        origin: sel.origin || prev.origin,
        destination: sel.destination || prev.destination,
        planned_distance_km: distance,
      }));
    } else {
      setFormData((prev) => ({ ...prev, route_id: routeId }));
    }
  }

  function addStop() {
    setStops((prev) => [
      ...prev,
      { stop_sequence: prev.length + 1, stop_type: 'Pickup', location: '' },
    ]);
  }

  function deleteStop(index: number) {
    setStops((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stop_sequence: i + 1 }))
    );
  }

  function moveStopUp(index: number) {
    if (index === 0) return;
    setStops((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((s, i) => ({ ...s, stop_sequence: i + 1 }));
    });
  }

  function moveStopDown(index: number) {
    setStops((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((s, i) => ({ ...s, stop_sequence: i + 1 }));
    });
  }

  function updateStop(index: number, field: keyof TripStop, value: any) {
    setStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  async function calculateMilkRunDistance() {
    if (routeType !== 'Milk Run' || stops.length < 2) {
      alert('Please add at least 2 stops for Milk Run to calculate distance');
      return;
    }
    for (const stop of stops) {
      if (!stop.location?.trim()) {
        alert('Please fill in all stop locations before calculating distance');
        return;
      }
    }
    setFetchingDistance(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-distance`;
      const sorted = [...stops].sort((a, b) => a.stop_sequence - b.stop_sequence);
      let total = 0;
      for (let i = 0; i < sorted.length - 1; i++) {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origin: `${sorted[i].location}, India`,
            destination: `${sorted[i + 1].location}, India`,
          }),
        });
        if (!res.ok) throw new Error('Distance API error');
        const data = await res.json();
        if (data.distance_km) total += data.distance_km;
        else { alert(`Could not fetch distance from stop ${i + 1} to ${i + 2}. Please enter manually.`); setFetchingDistance(false); return; }
      }
      setFormData((prev) => ({ ...prev, planned_distance_km: total }));
      alert(`Distance calculated: ${total} km`);
    } catch {
      alert('Error fetching distance from Google Maps. Please enter manually.');
    } finally {
      setFetchingDistance(false);
    }
  }

  async function calculateDistanceFromOriginDestination() {
    if (!formData.origin || !formData.destination) {
      alert('Please enter both Origin and Destination');
      return;
    }
    setFetchingDistance(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-distance`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: `${formData.origin}, India`,
          destination: `${formData.destination}, India`,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(`Error: ${data.error || 'Failed to calculate distance'}`); return; }
      if (data.distance_km) {
        setFormData((prev) => ({ ...prev, actual_distance_km: data.distance_km }));
        alert(`Distance calculated: ${data.distance_km} km`);
      } else {
        alert('Could not fetch distance. Please enter manually.');
      }
    } catch {
      alert('Error fetching distance from Google Maps. Please enter manually.');
    } finally {
      setFetchingDistance(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'close') { await handleCloseTrip(); return; }

    setSaving(true);
    try {
      if (mode === 'create' && !selectedEnquiryId) {
        alert('Please select an enquiry to create a trip');
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
          if (!stops[i].location) { alert(`Stop ${i + 1}: Location is required`); setSaving(false); return; }
        }
      }

      const enquiryId = selectedEnquiryData?.enquiry_id || null;
      if (mode === 'create' && enquiryId) {
        const { data: existing } = await supabase
          .from('trips')
          .select('trip_id')
          .eq('enquiry_id', enquiryId)
          .maybeSingle();
        if (existing) {
          alert('This enquiry has already been converted to a trip.');
          setSaving(false);
          return;
        }
      }

      const { odometer_current, ...tripFormData } = formData;
      const openingOdometerValue = Math.round(odometer_current || 0);

      const originText =
        routeType === 'Milk Run' && stops.length > 0
          ? stops.filter((s) => s.stop_type === 'Pickup').length > 0
            ? `Multi-stop: ${stops.filter((s) => s.stop_type === 'Pickup').length} pickup(s)`
            : formData.origin
          : formData.origin;

      const destinationText =
        routeType === 'Milk Run' && stops.length > 0
          ? stops.filter((s) => s.stop_type === 'Drop').length > 0
            ? `Multi-stop: ${stops.filter((s) => s.stop_type === 'Drop').length} drop(s)`
            : formData.destination
          : formData.destination;

      const tripData = {
        ...tripFormData,
        trip_type: routeType,
        origin: originText,
        destination: destinationText,
        ...(mode === 'create' && { trip_status: `In Transit To ${destinationText}` }),
        opening_odometer: openingOdometerValue || null,
        vehicle_id: formData.vehicle_id || null,
        driver_id: formData.driver_id || null,
        route_id: formData.route_id || null,
        customer_id: formData.customer_id || null,
        sales_person_id: formData.sales_person_id || null,
        planned_start_datetime: formData.planned_start_datetime || null,
        vehicle_placement_datetime: formData.vehicle_placement_datetime || null,
        planned_end_datetime: formData.planned_end_datetime || null,
        veh_departure: formData.veh_departure || null,
        loading_tat_hrs: formData.loading_tat_hrs || 0,
        enquiry_id: enquiryId,
        created_by: mode === 'create' ? user?.id : undefined,
      };

      if (mode === 'create') {
        const { data, error } = await supabase.from('trips').insert([tripData]).select();
        if (error) throw error;

        if (data && data[0] && routeType === 'Milk Run' && stops.length > 0) {
          const tripId = data[0].trip_id;
          const { error: stopsError } = await supabase.from('trip_stops').insert(
            stops.map((s) => ({
              trip_id: tripId,
              stop_sequence: s.stop_sequence,
              stop_type: s.stop_type,
              location: s.location,
              city_id: s.city_id || null,
              load_type: s.load_type || null,
              planned_arrival_datetime: s.planned_arrival_datetime || null,
              actual_arrival_datetime: s.actual_arrival_datetime || null,
              planned_departure_datetime: s.planned_departure_datetime || null,
              actual_departure_datetime: s.actual_departure_datetime || null,
              contact_person: s.contact_person || null,
              contact_phone: s.contact_phone || null,
              remarks: s.remarks || null,
            }))
          );
          if (stopsError) alert('Trip created but failed to save stops');
        }

        if (data && data[0] && enquiryId && selectedEnquiryData) {
          const createdTrip = data[0];
          const enquiryUpdates: Record<string, any> = {
            status: createdTrip.trip_status,
            trip_status: createdTrip.trip_status,
            converted_to_trip_id: createdTrip.trip_number,
          };

          if (formData.customer_id !== (selectedEnquiryData.customer_id || '')) {
            enquiryUpdates.customer_id = formData.customer_id || null;
          }
          if (originText !== (selectedEnquiryData.origin || '')) {
            enquiryUpdates.origin = originText;
          }
          if (destinationText !== (selectedEnquiryData.destination || '')) {
            enquiryUpdates.destination = destinationText;
          }
          if (formData.load_type !== (selectedEnquiryData.load_type || '')) {
            enquiryUpdates.load_type = formData.load_type || null;
          }
          if (Number(formData.freight_revenue) !== Number(selectedEnquiryData.quoted_rate || 0)) {
            enquiryUpdates.quoted_rate = formData.freight_revenue;
          }
          if (formData.remarks !== (selectedEnquiryData.remarks || '')) {
            enquiryUpdates.remarks = formData.remarks;
          }
          const formLoadingDate = formData.planned_start_datetime?.slice(0, 10);
          if (formLoadingDate && formLoadingDate !== selectedEnquiryData.loading_date) {
            enquiryUpdates.loading_date = formLoadingDate;
          }

          await supabase
            .from('enquiries')
            .update(enquiryUpdates)
            .eq('enquiry_id', enquiryId);
        }
      } else if (mode === 'edit' && trip) {
        const { error } = await supabase.from('trips').update(tripData).eq('trip_id', trip.trip_id);
        if (error) throw error;

        if (routeType === 'Milk Run') {
          await supabase.from('trip_stops').delete().eq('trip_id', trip.trip_id);
          if (stops.length > 0) {
            const { error: stopsError } = await supabase.from('trip_stops').insert(
              stops.map((s) => ({
                trip_id: trip.trip_id,
                stop_sequence: s.stop_sequence,
                stop_type: s.stop_type,
                location: s.location,
                city_id: s.city_id || null,
                load_type: s.load_type || null,
                planned_arrival_datetime: s.planned_arrival_datetime || null,
                actual_arrival_datetime: s.actual_arrival_datetime || null,
                planned_departure_datetime: s.planned_departure_datetime || null,
                actual_departure_datetime: s.actual_departure_datetime || null,
                contact_person: s.contact_person || null,
                contact_phone: s.contact_phone || null,
                remarks: s.remarks || null,
              }))
            );
            if (stopsError) alert('Trip updated but failed to save stops');
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
        alert(`Closing Odometer cannot be less than Opening Odometer (${openingOdometer})`);
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

      const userFullName = userProfiles.find((p) => p.user_id === closeFormData.trip_closed_by)?.full_name || 'Unknown';
      const actual_distance = closeFormData.closing_odometer - openingOdometer;

      const { error: tripError } = await supabase
        .from('trips')
        .update({
          planned_end_datetime: closeFormData.planned_end_datetime ? new Date(closeFormData.planned_end_datetime).toISOString() : null,
          actual_end_datetime: closeFormData.actual_end_datetime ? new Date(closeFormData.actual_end_datetime).toISOString() : null,
          closing_odometer: closeFormData.closing_odometer,
          actual_distance_km: actual_distance > 0 ? actual_distance : formData.actual_distance_km,
          trip_closed_by: userFullName,
          trip_closure: new Date().toISOString(),
          trip_status: 'Closed',
        })
        .eq('trip_id', trip.trip_id);

      if (tripError) throw tripError;

      if (trip.vehicle_id) {
        const selectedVehicle = vehicles.find((v) => v.vehicle_id === trip.vehicle_id);
        if (selectedVehicle && (selectedVehicle.ownership_type === 'Owned' || selectedVehicle.ownership_type === 'Attached')) {
          await supabase
            .from('vehicles')
            .update({ odometer_current: closeFormData.closing_odometer, veh_cur_status: 'Free', status: 'Active' })
            .eq('vehicle_id', trip.vehicle_id);
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
  const isCreateMode = mode === 'create';
  const title = isCloseMode ? 'Close Trip' : isCreateMode ? 'Create Trip' : mode === 'edit' ? 'Edit Trip' : 'View Trip';

  const ownershipTypeMap = { Own: 'Owned', Attached: 'Attached', Market: 'Market Vehicle' };
  const filteredVehicles =
    vehicleType === 'Market'
      ? []
      : vehicles.filter((v) => v.veh_cur_status === 'Free' && v.ownership_type === ownershipTypeMap[vehicleType]);

  const vehicleOptions = filteredVehicles.map((v) => ({
    value: v.vehicle_id,
    label: v.vehicle_number,
  }));

  const customerOptions = customers.map((c) => ({
    value: c.customer_id,
    label: c.customer_name,
  }));

  const userProfileOptions = userProfiles.map((p) => ({
    value: p.user_id,
    label: p.full_name,
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* ── CLOSE TRIP FORM ── */}
          {isCloseMode && trip && (
            <CloseTripForm
              trip={trip}
              formData={formData}
              closeFormData={closeFormData}
              setCloseFormData={setCloseFormData}
              userProfiles={userProfiles}
            />
          )}

          {/* ── CREATE / EDIT / VIEW FORM ── */}
          {!isCloseMode && (
            <TripForm
              mode={mode}
              isViewMode={isViewMode}
              isCreateMode={isCreateMode}
              formData={formData}
              setFormData={setFormData}
              availableEnquiries={availableEnquiries}
              selectedEnquiryId={selectedEnquiryId}
              selectedEnquiryData={selectedEnquiryData}
              handleEnquirySelection={handleEnquirySelection}
              vehicleType={vehicleType}
              setVehicleType={setVehicleType}
              vehicleOptions={vehicleOptions}
              filteredVehicles={filteredVehicles}
              vehicles={vehicles}
              customerOptions={customerOptions}
              userProfileOptions={userProfileOptions}
              routeType={routeType}
              setRouteType={setRouteType}
              stops={stops}
              setStops={setStops}
              addStop={addStop}
              deleteStop={deleteStop}
              moveStopUp={moveStopUp}
              moveStopDown={moveStopDown}
              updateStop={updateStop}
              routes={routes}
              drivers={drivers}
              handleRouteSelection={handleRouteSelection}
              fetchingDistance={fetchingDistance}
              calculateMilkRunDistance={calculateMilkRunDistance}
              calculateDistanceFromOriginDestination={calculateDistanceFromOriginDestination}
              showFreightRevenue={showFreightRevenue}
              setShowFreightRevenue={setShowFreightRevenue}
            />
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
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-400 font-medium"
              >
                {saving ? 'Saving...' : isCloseMode ? 'Close Trip' : isCreateMode ? 'Create Trip' : 'Update Trip'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   UNIFIED TRIP FORM (create / edit / view)
───────────────────────────────────────────── */
interface TripFormProps {
  mode: string;
  isViewMode: boolean;
  isCreateMode: boolean;
  formData: any;
  setFormData: (d: any) => void;
  availableEnquiries: any[];
  selectedEnquiryId: string;
  selectedEnquiryData: any;
  handleEnquirySelection: (id: string) => void;
  vehicleType: 'Own' | 'Attached' | 'Market';
  setVehicleType: (t: 'Own' | 'Attached' | 'Market') => void;
  vehicleOptions: { value: string; label: string }[];
  filteredVehicles: any[];
  vehicles: any[];
  customerOptions: { value: string; label: string }[];
  userProfileOptions: { value: string; label: string }[];
  routeType: 'Single' | 'Milk Run';
  setRouteType: (t: 'Single' | 'Milk Run') => void;
  stops: TripStop[];
  setStops: (s: TripStop[]) => void;
  addStop: () => void;
  deleteStop: (i: number) => void;
  moveStopUp: (i: number) => void;
  moveStopDown: (i: number) => void;
  updateStop: (i: number, f: keyof TripStop, v: any) => void;
  routes: any[];
  drivers: any[];
  handleRouteSelection: (id: string) => void;
  fetchingDistance: boolean;
  calculateMilkRunDistance: () => void;
  calculateDistanceFromOriginDestination: () => void;
  showFreightRevenue: boolean;
  setShowFreightRevenue: (v: boolean) => void;
}

function TripForm({
  mode, isViewMode, isCreateMode,
  formData, setFormData,
  availableEnquiries, selectedEnquiryId, selectedEnquiryData,
  handleEnquirySelection,
  vehicleType, setVehicleType,
  vehicleOptions, filteredVehicles, vehicles,
  customerOptions, userProfileOptions,
  routeType, setRouteType,
  stops, setStops,
  addStop, deleteStop, moveStopUp, moveStopDown, updateStop,
  routes, drivers, handleRouteSelection,
  fetchingDistance, calculateMilkRunDistance, calculateDistanceFromOriginDestination,
  showFreightRevenue, setShowFreightRevenue,
}: TripFormProps) {
  return (
    <div className="space-y-5">

      {/* ── ENQUIRY SELECTOR (create mode) ── */}
      {isCreateMode && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <label className="block text-sm font-semibold text-blue-900 mb-2">
            Select Enquiry <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedEnquiryId}
            onChange={(e) => handleEnquirySelection(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
          >
            <option value="">— Select an enquiry to begin —</option>
            {availableEnquiries.map((eq) => (
              <option key={eq.enquiry_id} value={eq.enquiry_id}>
                {eq.enquiry_number} &nbsp;|&nbsp; {eq.customer?.customer_name} &nbsp;|&nbsp; {eq.origin} → {eq.destination}
              </option>
            ))}
          </select>
          {selectedEnquiryData && (
            <p className="mt-2 text-xs text-blue-700">
              Fields pre-filled from enquiry — you may edit any value before creating the trip.
            </p>
          )}
        </div>
      )}

      {/* ── SHOW/HIDE ENQUIRY INFO IN EDIT/VIEW MODE ── */}
      {!isCreateMode && selectedEnquiryData && (
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          Linked to enquiry: <strong>{selectedEnquiryData.enquiry_number}</strong>
        </div>
      )}

      {/* ── SECTION: SALES PERSON + CUSTOMER ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              Sales Person
            </span>
          </label>
          <SearchableSelect
            value={formData.sales_person_id}
            onChange={(val) => setFormData({ ...formData, sales_person_id: val })}
            options={userProfileOptions}
            placeholder="Select sales person..."
            disabled={isViewMode}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer</label>
          <SearchableSelect
            value={formData.customer_id}
            onChange={(val) => setFormData({ ...formData, customer_id: val })}
            options={customerOptions}
            placeholder="Search customer..."
            disabled={isViewMode}
          />
        </div>
      </div>

      {/* ── SECTION: VEHICLE ── */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-gray-400" />
              Vehicle Type
            </span>
          </label>
          <div className="flex flex-wrap gap-4">
            {(['Own', 'Attached', 'Market'] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="vehicleType"
                  value={t}
                  checked={vehicleType === t}
                  disabled={isViewMode}
                  onChange={() => {
                    setVehicleType(t);
                    setFormData({ ...formData, vehicle_id: '', vehicle_number_text: '', odometer_current: 0 });
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Vehicle {vehicleType !== 'Market' && <span className="text-gray-400 text-xs">(Free vehicles only)</span>}
            </label>
            {vehicleType === 'Market' ? (
              <input
                type="text"
                value={formData.vehicle_number_text}
                onChange={(e) => setFormData({ ...formData, vehicle_number_text: e.target.value })}
                disabled={isViewMode}
                placeholder="Enter vehicle number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
              />
            ) : (
              <SearchableSelect
                value={formData.vehicle_id}
                onChange={(val) => {
                  const sel = filteredVehicles.find((v) => v.vehicle_id === val);
                  setFormData({ ...formData, vehicle_id: val, odometer_current: Math.round(sel?.odometer_current || 0) });
                }}
                options={vehicleOptions}
                placeholder="Search vehicle..."
                disabled={isViewMode}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Odometer (KM)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={formData.odometer_current}
              onChange={(e) => setFormData({ ...formData, odometer_current: Math.round(Number(e.target.value)) })}
              disabled={isViewMode}
              placeholder="Auto-populated from vehicle"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
            />
          </div>
        </div>
      </div>

      {/* ── SECTION: ROUTE ── */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-gray-400" />
              Route Type <span className="text-red-500">*</span>
            </span>
          </label>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="routeType"
                value="Single"
                checked={routeType === 'Single'}
                disabled={isViewMode}
                onChange={() => { setRouteType('Single'); setStops([]); }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Single Trip (Point A to Point B)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="routeType"
                value="Milk Run"
                checked={routeType === 'Milk Run'}
                disabled={isViewMode}
                onChange={() => {
                  setRouteType('Milk Run');
                  setFormData({ ...formData, route_id: '' });
                  if (stops.length === 0) {
                    setStops([
                      { stop_sequence: 1, stop_type: 'Pickup', location: '' },
                      { stop_sequence: 2, stop_type: 'Drop', location: '' },
                    ]);
                  }
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Milk Run (Multiple Pickups/Drops)</span>
            </label>
          </div>
        </div>

        {routeType === 'Single' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Origin <span className="text-red-500">*</span>
              </label>
              <CityAutocomplete
                value={formData.origin}
                onChange={(val) => setFormData({ ...formData, origin: val })}
                disabled={isViewMode}
                required
                placeholder="Search origin city..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Destination <span className="text-red-500">*</span>
              </label>
              <CityAutocomplete
                value={formData.destination}
                onChange={(val) => setFormData({ ...formData, destination: val })}
                disabled={isViewMode}
                required
                placeholder="Search destination city..."
              />
            </div>
          </div>
        ) : (
          <MilkRunStops
            stops={stops}
            isViewMode={isViewMode}
            addStop={addStop}
            deleteStop={deleteStop}
            moveStopUp={moveStopUp}
            moveStopDown={moveStopDown}
            updateStop={updateStop}
          />
        )}
      </div>

      {/* ── SECTION: DRIVER + HELPER + ROUTE ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Driver</label>
          <select
            value={formData.driver_id}
            onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm bg-white"
          >
            <option value="">Select Driver</option>
            {drivers.map((d) => (
              <option key={d.driver_id} value={d.driver_id}>{d.driver_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Helper Name</label>
          <input
            type="text"
            value={formData.helper_name}
            onChange={(e) => setFormData({ ...formData, helper_name: e.target.value })}
            disabled={isViewMode}
            placeholder="Helper name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Route</label>
          <select
            value={formData.route_id}
            onChange={(e) => handleRouteSelection(e.target.value)}
            disabled={isViewMode || routeType === 'Milk Run'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm bg-white"
          >
            <option value="">Select Route</option>
            {routes.map((r) => (
              <option key={r.route_id} value={r.route_id}>
                {r.route_code} ({r.origin} → {r.destination})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── SECTION: DISTANCES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Planned Distance (KM)</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={formData.planned_distance_km}
              onChange={(e) => setFormData({ ...formData, planned_distance_km: Number(e.target.value) })}
              disabled={isViewMode}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
            />
            {routeType === 'Milk Run' && !isViewMode && (
              <button
                type="button"
                onClick={calculateMilkRunDistance}
                disabled={fetchingDistance || stops.length < 2}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 text-sm flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                {fetchingDistance ? '...' : 'Calc'}
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Actual Distance (Google KM)</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={formData.actual_distance_km}
              onChange={(e) => setFormData({ ...formData, actual_distance_km: Number(e.target.value) })}
              disabled={isViewMode}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
            />
            {!isViewMode && routeType !== 'Milk Run' && (
              <button
                type="button"
                onClick={calculateDistanceFromOriginDestination}
                disabled={fetchingDistance || !formData.origin || !formData.destination}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 text-sm flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                {fetchingDistance ? '...' : 'Calc'}
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Actual Distance Manual (KM)</label>
          <input
            type="number"
            step="0.01"
            value={formData.actual_distance_manual_km}
            onChange={(e) => setFormData({ ...formData, actual_distance_manual_km: Number(e.target.value) })}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
        </div>
      </div>

      {/* ── SECTION: LOAD TYPE + FREIGHT REVENUE + STATUS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-gray-400" />
              Load Type
            </span>
          </label>
          <select
            value={formData.load_type}
            onChange={(e) => setFormData({ ...formData, load_type: e.target.value })}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm bg-white"
          >
            <option value="">Select Load Type</option>
            <option value="Reefer-Chilled">Reefer-Chilled</option>
            <option value="Reefer-Ambient">Reefer-Ambient</option>
            <option value="Dry">Dry</option>
            <option value="Empty">Empty</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Freight Revenue (₹)</label>
          <div className="relative">
            <input
              type={showFreightRevenue ? 'number' : 'password'}
              step="0.01"
              value={formData.freight_revenue}
              onChange={(e) => setFormData({ ...formData, freight_revenue: Number(e.target.value) })}
              disabled={isViewMode}
              placeholder="0.00"
              autoComplete="off"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowFreightRevenue(!showFreightRevenue)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showFreightRevenue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
          {isCreateMode ? (
            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500 font-medium">
              {formData.destination ? `In Transit To ${formData.destination}` : 'In Transit To (destination)'}
            </div>
          ) : (
            <select
              value={formData.trip_status}
              onChange={(e) => setFormData({ ...formData, trip_status: e.target.value })}
              disabled={isViewMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm bg-white"
            >
              <option value="Planned">Planned</option>
              <option value="In Transit">In Transit</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          )}
        </div>
      </div>

      {/* ── SECTION: DATES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Planned Start Date/Time</label>
          <input
            type="datetime-local"
            value={formData.planned_start_datetime}
            onChange={(e) => setFormData({ ...formData, planned_start_datetime: e.target.value })}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Placement Date/Time</label>
          <input
            type="datetime-local"
            value={formData.vehicle_placement_datetime}
            onChange={(e) => {
              const newVal = e.target.value;
              let tat = formData.loading_tat_hrs;
              if (newVal && formData.veh_departure) {
                tat = Number(((new Date(formData.veh_departure).getTime() - new Date(newVal).getTime()) / 3600000).toFixed(2));
              }
              setFormData({ ...formData, vehicle_placement_datetime: newVal, loading_tat_hrs: tat });
            }}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Planned End Date/Time</label>
          <input
            type="datetime-local"
            value={formData.planned_end_datetime}
            onChange={(e) => setFormData({ ...formData, planned_end_datetime: e.target.value })}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Veh Departure Date/Time</label>
          <input
            type="datetime-local"
            value={formData.veh_departure}
            onChange={(e) => {
              const newVal = e.target.value;
              let tat = formData.loading_tat_hrs;
              if (newVal && formData.vehicle_placement_datetime) {
                tat = Number(((new Date(newVal).getTime() - new Date(formData.vehicle_placement_datetime).getTime()) / 3600000).toFixed(2));
              }
              setFormData({
                ...formData,
                veh_departure: newVal,
                loading_tat_hrs: tat,
                trip_status: newVal ? 'In Transit' : formData.trip_status,
              });
            }}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
          {formData.veh_departure && (
            <p className="text-xs text-green-600 mt-1">Status will be set to 'In Transit'</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Loading TAT (Hrs)</label>
          <input
            type="number"
            step="0.01"
            value={formData.loading_tat_hrs}
            onChange={(e) => setFormData({ ...formData, loading_tat_hrs: parseFloat(e.target.value) || 0 })}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
        </div>
      </div>

      {/* ── SECTION: REVENUE ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Other Revenue (₹)</label>
          <input
            type="number"
            step="0.01"
            value={formData.other_revenue}
            onChange={(e) => setFormData({ ...formData, other_revenue: Number(e.target.value) })}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Advance to Driver (₹)</label>
          <input
            type="number"
            step="0.01"
            value={formData.advance_to_driver}
            onChange={(e) => setFormData({ ...formData, advance_to_driver: Number(e.target.value) })}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
        </div>
      </div>

      {/* ── SECTION: REMARKS ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
        <textarea
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          disabled={isViewMode}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
        />
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────
   MILK RUN STOPS
───────────────────────────────────────────── */
function MilkRunStops({ stops, isViewMode, addStop, deleteStop, moveStopUp, moveStopDown, updateStop }: {
  stops: TripStop[];
  isViewMode: boolean;
  addStop: () => void;
  deleteStop: (i: number) => void;
  moveStopUp: (i: number) => void;
  moveStopDown: (i: number) => void;
  updateStop: (i: number, f: keyof TripStop, v: any) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">
          Trip Stops <span className="text-red-500">*</span>
        </label>
        {!isViewMode && (
          <button
            type="button"
            onClick={addStop}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stop
          </button>
        )}
      </div>
      <div className="space-y-3">
        {stops.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4 bg-white rounded-lg border border-dashed border-gray-200">
            No stops added. Add at least 2 stops for milk run trip.
          </p>
        ) : (
          stops.map((stop, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-2">
                  <MapPin className={`w-5 h-5 ${stop.stop_type === 'Pickup' ? 'text-green-600' : 'text-blue-600'}`} />
                  {!isViewMode && (
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => moveStopUp(index)} disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                        <GripVertical className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => moveStopDown(index)} disabled={index === stops.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                        <GripVertical className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Stop #{stop.stop_sequence} — Type *
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
                      onChange={(val) => updateStop(index, 'location', val)}
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
                    <input type="text" value={stop.contact_person || ''} onChange={(e) => updateStop(index, 'contact_person', e.target.value)}
                      disabled={isViewMode} placeholder="Contact name"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
                    <input type="text" value={stop.contact_phone || ''} onChange={(e) => updateStop(index, 'contact_phone', e.target.value)}
                      disabled={isViewMode} placeholder="Phone number"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                    <input type="text" value={stop.remarks || ''} onChange={(e) => updateStop(index, 'remarks', e.target.value)}
                      disabled={isViewMode} placeholder="Any notes"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100" />
                  </div>
                </div>
                {!isViewMode && (
                  <button type="button" onClick={() => deleteStop(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors mt-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CLOSE TRIP FORM
───────────────────────────────────────────── */
function CloseTripForm({ trip, formData, closeFormData, setCloseFormData, userProfiles }: {
  trip: any;
  formData: any;
  closeFormData: any;
  setCloseFormData: (d: any) => void;
  userProfiles: any[];
}) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-800">Trip: <strong>{trip.trip_number}</strong></p>
        <p className="text-sm text-blue-800">Route: <strong>{trip.origin} → {trip.destination}</strong></p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Trip Closed By *</label>
        <select value={closeFormData.trip_closed_by}
          onChange={(e) => setCloseFormData({ ...closeFormData, trip_closed_by: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
          <option value="">Select user</option>
          {userProfiles.map((p) => (
            <option key={p.user_id} value={p.user_id}>{p.full_name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Planned End Date/Time *</label>
        <input type="datetime-local" value={closeFormData.planned_end_datetime} required
          onChange={(e) => setCloseFormData({ ...closeFormData, planned_end_datetime: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Actual End Date/Time *</label>
        <input type="datetime-local" value={closeFormData.actual_end_datetime} required
          onChange={(e) => setCloseFormData({ ...closeFormData, actual_end_datetime: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
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
            const opening = formData.odometer_current || 0;
            const planned = formData.planned_distance_km || 0;
            const minAllowed = opening + planned * 0.8;
            const maxAllowed = opening + planned * 1.2;
            const isLess = closeFormData.closing_odometer > 0 && closeFormData.closing_odometer < opening;
            const isOut = closeFormData.closing_odometer > 0 && !isLess &&
              (closeFormData.closing_odometer < minAllowed || closeFormData.closing_odometer > maxAllowed);
            return (
              <>
                <input type="number" step="0.01" value={closeFormData.closing_odometer} required
                  onChange={(e) => setCloseFormData({ ...closeFormData, closing_odometer: Number(e.target.value) })}
                  placeholder="Enter closing odometer"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isLess || isOut ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                {isLess && <p className="text-red-600 text-xs mt-1">Cannot be less than opening odometer</p>}
                {isOut && !isLess && <p className="text-red-600 text-xs mt-1">Must be within ±20% of planned distance</p>}
                <p className="text-gray-400 text-xs mt-1">Allowed: {Math.round(minAllowed * 100) / 100} – {Math.round(maxAllowed * 100) / 100} KM</p>
              </>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
        {[
          { label: 'Trip #', value: trip.trip_number },
          { label: 'Status', value: trip.trip_status },
          { label: 'Starting Odometer', value: `${formData.odometer_current} KM` },
          { label: 'Planned Distance', value: `${trip.planned_distance_km} KM` },
          { label: 'Current Actual Distance', value: `${trip.actual_distance_km} KM` },
          { label: 'Calculated Distance', value: `${Math.max(0, closeFormData.closing_odometer - (formData.odometer_current || 0))} KM` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-gray-500 uppercase">{label}</p>
            <p className="font-medium text-gray-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
