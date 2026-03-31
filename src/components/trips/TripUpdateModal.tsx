import { useEffect, useState } from 'react';
import {
  X, Navigation, User, Truck, MapPin, Package, IndianRupee,
  Calendar, Tag, FileText, Lock, Gauge, AlertCircle, Receipt,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchableSelect } from './SearchableSelect';
import { LREntryModal } from './LREntryModal';

interface TripUpdateModalProps {
  trip: any;
  drivers: any[];
  userProfiles: any[];
  vehicles: any[];
  customers: any[];
  onClose: () => void;
  onSuccess: () => void;
}

interface SecondaryForm {
  driver_id: string;
  helper_name: string;
  planned_distance_km: string;
  actual_distance_km: string;
  planned_start_datetime: string;
  vehicle_placement_datetime: string;
  veh_departure: string;
  planned_end_datetime: string;
  diesel_card_id: string;
  advance_to_driver: string;
  remarks: string;
  freight_revenue: string;
  odometer_current: string;
}

export function TripUpdateModal({
  trip,
  drivers,
  userProfiles,
  vehicles,
  customers,
  onClose,
  onSuccess,
}: TripUpdateModalProps) {
  const [dieselCards, setDieselCards] = useState<any[]>([]);
  const [fetchingDistance, setFetchingDistance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLR, setShowLR] = useState(false);

  const freightMissing =
    !trip?.freight_revenue || Number(trip?.freight_revenue) === 0;

  const vehicleRecord = vehicles.find((v) => v.vehicle_id === trip?.vehicle_id);

  const [form, setForm] = useState<SecondaryForm>({
    driver_id: trip?.driver_id || '',
    helper_name: trip?.helper_name || '',
    planned_distance_km: trip?.planned_distance_km ? String(trip.planned_distance_km) : '',
    actual_distance_km: trip?.actual_distance_km ? String(trip.actual_distance_km) : '',
    planned_start_datetime: trip?.planned_start_datetime?.slice(0, 16) || '',
    vehicle_placement_datetime: trip?.vehicle_placement_datetime?.slice(0, 16) || '',
    veh_departure: trip?.veh_departure?.slice(0, 16) || '',
    planned_end_datetime: trip?.planned_end_datetime?.slice(0, 16) || '',
    diesel_card_id: trip?.diesel_card_id || '',
    advance_to_driver: trip?.advance_to_driver ? String(trip.advance_to_driver) : '',
    remarks: trip?.remarks || '',
    freight_revenue: freightMissing ? '' : String(trip.freight_revenue),
    odometer_current: vehicleRecord?.odometer_current != null
      ? String(vehicleRecord.odometer_current)
      : '',
  });

  useEffect(() => {
    loadDieselCards();
    if (trip?.vehicle_id) {
      fetchOdometer();
    }
  }, []);

  async function loadDieselCards() {
    const { data } = await supabase
      .from('diesel_cards_master')
      .select('diesel_card_id, card_name, card_number, provider, is_active')
      .eq('is_active', true)
      .order('card_name');
    if (data) setDieselCards(data);
  }

  async function fetchOdometer() {
    if (!trip?.vehicle_id) return;
    const { data } = await supabase
      .from('vehicles')
      .select('odometer_current')
      .eq('vehicle_id', trip.vehicle_id)
      .maybeSingle();
    if (data && data.odometer_current != null) {
      setForm((prev) => ({ ...prev, odometer_current: String(data.odometer_current) }));
    }
  }

  async function fetchDistance() {
    const origin = trip?.origin;
    const destination = trip?.destination;

    if (!origin || !destination || origin.startsWith('Multi-stop') || destination.startsWith('Multi-stop')) {
      alert('Cannot fetch distance for Milk Run trips. Please enter manually.');
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
          origin: `${origin}, India`,
          destination: `${destination}, India`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error || 'Failed to calculate distance'}`);
        return;
      }
      if (data.distance_km) {
        setForm((prev) => ({ ...prev, planned_distance_km: String(data.distance_km) }));
        alert(`Distance fetched: ${data.distance_km} km`);
      } else {
        alert('Could not fetch distance. Please enter manually.');
      }
    } catch {
      alert('Error contacting distance service. Please enter manually.');
    } finally {
      setFetchingDistance(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.driver_id) { alert('Driver is mandatory'); return; }
    if (!form.actual_distance_km || Number(form.actual_distance_km) <= 0) {
      alert('Actual Distance as per Google is mandatory'); return;
    }
    if (!form.planned_start_datetime) { alert('Planned Start Date/Time is mandatory'); return; }
    if (!form.vehicle_placement_datetime) { alert('Vehicle Placement Date/Time is mandatory'); return; }
    if (!form.veh_departure) { alert('Vehicle Departure Date/Time is mandatory'); return; }
    if (!form.planned_end_datetime) { alert('Planned End Date/Time is mandatory'); return; }
    if (!form.advance_to_driver || Number(form.advance_to_driver) < 0) {
      alert('Advance Rs. is mandatory'); return;
    }
    if (freightMissing && (!form.freight_revenue || Number(form.freight_revenue) <= 0)) {
      alert('Freight Revenue is mandatory'); return;
    }

    setSaving(true);
    try {
      const newStatus = form.veh_departure ? 'In Transit' : trip.trip_status;

      const tripUpdate: Record<string, unknown> = {
        driver_id: form.driver_id || null,
        helper_name: form.helper_name || '',
        planned_distance_km: Number(form.planned_distance_km) || 0,
        actual_distance_km: Number(form.actual_distance_km),
        actual_distance_manual_km: Number(form.actual_distance_km),
        planned_start_datetime: form.planned_start_datetime
          ? new Date(form.planned_start_datetime).toISOString()
          : null,
        vehicle_placement_datetime: form.vehicle_placement_datetime
          ? new Date(form.vehicle_placement_datetime).toISOString()
          : null,
        veh_departure: form.veh_departure
          ? new Date(form.veh_departure).toISOString()
          : null,
        planned_end_datetime: form.planned_end_datetime
          ? new Date(form.planned_end_datetime).toISOString()
          : null,
        diesel_card_id: form.diesel_card_id || null,
        advance_to_driver: Number(form.advance_to_driver) || 0,
        remarks: form.remarks || '',
        trip_status: newStatus,
      };

      if (freightMissing) {
        tripUpdate.freight_revenue = Number(form.freight_revenue);
      }

      const { error: tripError } = await supabase
        .from('trips')
        .update(tripUpdate)
        .eq('trip_id', trip.trip_id);

      if (tripError) throw tripError;

      if (trip.vehicle_id && form.odometer_current !== '') {
        const { error: odomError } = await supabase
          .from('vehicles')
          .update({ odometer_current: Number(form.odometer_current) })
          .eq('vehicle_id', trip.vehicle_id);
        if (odomError) throw odomError;
      }

      setSaved(true);
    } catch (error: any) {
      console.error('Error updating trip:', error);
      alert(`Failed to update trip: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setSaving(false);
    }
  }

  const selectedDriver = drivers.find((d) => d.driver_id === form.driver_id);
  const driverOptions = drivers.map((d) => ({ value: d.driver_id, label: d.driver_name }));
  const dieselCardOptions = dieselCards.map((c) => ({
    value: c.diesel_card_id,
    label: `${c.card_name} — ${c.card_number}${c.provider ? ` (${c.provider})` : ''}`,
  }));

  const salesPerson = userProfiles.find((p) => p.user_id === trip?.sales_person_id);
  const customer = customers.find((c) => c.customer_id === trip?.customer_id);

  const vehicleName =
    trip?.vehicle_id
      ? vehicleRecord?.vehicle_number || 'Unknown Vehicle'
      : trip?.vehicle_number_text || 'Not Assigned';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planned': return 'bg-blue-100 text-blue-700';
      case 'In Transit': return 'bg-yellow-100 text-yellow-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Update Trip</h2>
            <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
              {trip.trip_number}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(trip.trip_status)}`}>
              {trip.trip_status}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* PRIMARY SECTION — READ ONLY */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xs font-bold">1</span>
              </div>
              <h3 className="text-gray-600 font-semibold text-sm tracking-wide uppercase">Primary Information</h3>
              <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                <Lock className="w-3.5 h-3.5" />
                Read Only
              </span>
            </div>

            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
              <PrimaryField
                icon={<User className="w-3.5 h-3.5" />}
                label="Sales Person"
                value={salesPerson?.full_name || '—'}
              />
              <PrimaryField
                icon={<Tag className="w-3.5 h-3.5" />}
                label="Trip Source"
                value={trip.enquiry_id ? 'Enquiry' : 'Ad Hoc'}
              />
              <PrimaryField
                icon={<Truck className="w-3.5 h-3.5" />}
                label="Vehicle"
                value={vehicleName}
              />
              <PrimaryField
                icon={<User className="w-3.5 h-3.5" />}
                label="Customer"
                value={customer?.customer_name || trip?.customer?.customer_name || '—'}
              />
              <PrimaryField
                icon={<MapPin className="w-3.5 h-3.5" />}
                label="Route"
                value={`${trip.origin} → ${trip.destination}`}
                span
              />
              <PrimaryField
                icon={<Package className="w-3.5 h-3.5" />}
                label="Load Type"
                value={trip.load_type || '—'}
              />
              {!freightMissing && (
                <PrimaryField
                  icon={<IndianRupee className="w-3.5 h-3.5" />}
                  label="Freight Revenue"
                  value={
                    new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(trip.freight_revenue)
                  }
                />
              )}
              <PrimaryField
                icon={<Tag className="w-3.5 h-3.5" />}
                label="Route Type"
                value={trip.trip_type || 'Single'}
              />
            </div>
          </div>

          {/* SECONDARY SECTION — EDITABLE */}
          <div className="rounded-xl border border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <h3 className="text-white font-semibold text-sm tracking-wide uppercase">Secondary Information</h3>
            </div>

            <div className="p-5 space-y-5 bg-white">

              {/* Freight Revenue alert + field — only when missing */}
              {freightMissing && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 font-medium">
                      Freight Revenue was not set during trip creation. Please enter it now.
                    </p>
                  </div>
                  <div className="max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Freight Revenue (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={form.freight_revenue}
                        onChange={(e) => setForm({ ...form, freight_revenue: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Row 1: Driver + Helper */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Driver <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={form.driver_id}
                    onChange={(val) => setForm({ ...form, driver_id: val })}
                    options={driverOptions}
                    placeholder="Search driver..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Helper Name</label>
                  <input
                    type="text"
                    value={form.helper_name}
                    onChange={(e) => setForm({ ...form, helper_name: e.target.value })}
                    placeholder="Enter helper name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Distance + Odometer */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distance & Odometer</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Planned Distance (KM)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={form.planned_distance_km}
                        onChange={(e) => setForm({ ...form, planned_distance_km: e.target.value })}
                        placeholder="Auto-fill via Fetch"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <button
                        type="button"
                        onClick={fetchDistance}
                        disabled={fetchingDistance}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-300 text-sm font-medium whitespace-nowrap"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        {fetchingDistance ? 'Fetching...' : 'Fetch Distance'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Auto-fetch from {trip.origin} → {trip.destination}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Actual Distance as per Google (KM) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.actual_distance_km}
                      onChange={(e) => setForm({ ...form, actual_distance_km: e.target.value })}
                      placeholder="Enter actual distance"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {trip.vehicle_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-gray-400" />
                          Odometer (KM)
                        </span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={form.odometer_current}
                        onChange={(e) => setForm({ ...form, odometer_current: e.target.value })}
                        placeholder="Current odometer reading"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Current reading for {vehicleRecord?.vehicle_number || 'this vehicle'} — will be saved to vehicle record
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Date/Time fields */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Schedule
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DateTimeField
                    label="Planned Start Date/Time"
                    required
                    value={form.planned_start_datetime}
                    onChange={(val) => setForm({ ...form, planned_start_datetime: val })}
                  />
                  <DateTimeField
                    label="Vehicle Placement Date/Time"
                    required
                    value={form.vehicle_placement_datetime}
                    onChange={(val) => setForm({ ...form, vehicle_placement_datetime: val })}
                  />
                  <DateTimeField
                    label="Vehicle Departure Date/Time"
                    required
                    value={form.veh_departure}
                    onChange={(val) => setForm({ ...form, veh_departure: val })}
                    hint={form.veh_departure ? "Status will change to 'In Transit'" : undefined}
                  />
                  <DateTimeField
                    label="Planned End Date/Time"
                    required
                    value={form.planned_end_datetime}
                    onChange={(val) => setForm({ ...form, planned_end_datetime: val })}
                  />
                </div>
              </div>

              {/* Row 4: Petro Card + Advance + Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select Petro Card
                  </label>
                  <SearchableSelect
                    value={form.diesel_card_id}
                    onChange={(val) => setForm({ ...form, diesel_card_id: val })}
                    options={dieselCardOptions}
                    placeholder="Search petro card..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Advance (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.advance_to_driver}
                      onChange={(e) => setForm({ ...form, advance_to_driver: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      Remarks
                    </span>
                  </label>
                  <textarea
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    rows={3}
                    placeholder="Any additional notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                  Trip saved successfully
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { onSuccess(); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                {saved ? 'Close' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving || saved}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-300 font-medium text-sm"
              >
                {saving ? 'Saving...' : saved ? 'Saved' : 'Save & Update Trip'}
              </button>
              <button
                type="button"
                disabled={!saved}
                onClick={() => setShowLR(true)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                  saved
                    ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                <Receipt className="w-4 h-4" />
                Generate LR
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    {showLR && (
      <LREntryModal
        trip={trip}
        driverName={selectedDriver?.driver_name || ''}
        vehicleName={vehicleName}
        customerName={customer?.customer_name || trip?.customer?.customer_name || ''}
        onClose={() => setShowLR(false)}
      />
    )}
    </>
  );
}

function PrimaryField({
  icon, label, value, span,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  span?: boolean;
}) {
  return (
    <div className={`${span ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-gray-400">{icon}</span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 truncate">
        {value}
      </p>
    </div>
  );
}

function DateTimeField({
  label, required, value, onChange, hint,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
      {hint && <p className="text-xs text-green-600 mt-1">{hint}</p>}
    </div>
  );
}
