import { useRef, useState } from 'react';
import {
  X,
  Truck,
  User,
  MapPin,
  Calendar,
  Gauge,
  CheckCircle2,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface ArrivalTrip {
  trip_id: string;
  trip_number: string;
  vehicle_id: string | null;
  vehicle_number_text?: string;
  driver_id: string | null;
  origin: string;
  destination: string;
  trip_status: string;
  veh_departure: string | null;
  planned_end_datetime: string | null;
  estimated_report_datetime: string | null;
  opening_odometer: number | null;
  closing_odometer: number;
  vehicle?: { vehicle_number: string } | null;
  driver?: { driver_name: string } | null;
  customer?: { customer_name: string } | null;
  route?: { route_code: string } | null;
}

interface TruckArrivalModalProps {
  trip: ArrivalTrip;
  onClose: () => void;
  onSuccess: () => void;
}

interface ArrivalForm {
  arrival_datetime: string;
  closing_odometer: string;
  pod_file: File | null;
}

interface FormErrors {
  arrival_datetime?: string;
  closing_odometer?: string;
}

export function TruckArrivalModal({ trip, onClose, onSuccess }: TruckArrivalModalProps) {
  const [form, setForm] = useState<ArrivalForm>({
    arrival_datetime: new Date().toISOString().slice(0, 16),
    closing_odometer: trip.closing_odometer ? String(trip.closing_odometer) : '',
    pod_file: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const destination = trip.destination;
  const newVehicleStatus = `Available at ${destination}`;

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.arrival_datetime) errs.arrival_datetime = 'Arrival date & time is required';
    const closingOdo = Number(form.closing_odometer);
    if (!form.closing_odometer || isNaN(closingOdo) || closingOdo < 0) {
      errs.closing_odometer = 'Valid closing odometer reading is required';
    } else if (trip.opening_odometer != null && closingOdo <= trip.opening_odometer) {
      errs.closing_odometer = `Must be greater than opening odometer (${trip.opening_odometer} km)`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function uploadPOD(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const path = `${trip.trip_id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('pod-uploads').upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(`POD upload failed: ${error.message}`);
    return path;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);

    try {
      let podPath: string | null = null;
      if (form.pod_file) {
        podPath = await uploadPOD(form.pod_file);
      }

      const { error: tripError } = await supabase
        .from('trips')
        .update({
          actual_end_datetime: new Date(form.arrival_datetime).toISOString(),
          closing_odometer: Number(form.closing_odometer),
          pod_file: podPath,
          trip_status: `Available at ${destination}`,
        })
        .eq('trip_id', trip.trip_id);

      if (tripError) throw tripError;

      if (trip.vehicle_id) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({
            odometer_current: Number(form.closing_odometer),
            veh_cur_status: newVehicleStatus,
          })
          .eq('vehicle_id', trip.vehicle_id);

        if (vehicleError) throw vehicleError;
      }

      onSuccess();
    } catch (err: any) {
      setSaveError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, pod_file: file }));
  }

  function clearFile() {
    setForm((prev) => ({ ...prev, pod_file: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const formatDateTime = (dt: string | null) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Process Truck Arrival</h2>
              <p className="text-[12px] text-gray-500 mt-0.5">Trip #{trip.trip_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Trip Context Card */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Trip Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500">Vehicle</p>
                  <p className="text-[13px] font-medium text-slate-800">
                    {trip.vehicle?.vehicle_number || trip.vehicle_number_text || 'Not Assigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500">Driver</p>
                  <p className="text-[13px] font-medium text-slate-800">
                    {trip.driver?.driver_name || 'Not Assigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 col-span-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500">Route</p>
                  <p className="text-[13px] font-medium text-slate-800">
                    {trip.origin} <span className="text-slate-400">→</span> {trip.destination}
                  </p>
                </div>
              </div>
              {trip.veh_departure && (
                <div className="flex items-start gap-2 col-span-2">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-500">Departed</p>
                    <p className="text-[13px] font-medium text-slate-800">
                      {formatDateTime(trip.veh_departure)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 col-span-2">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500">Estimated Report Date</p>
                  <p className="text-[13px] font-medium text-slate-800">
                    {formatDateTime(trip.estimated_report_datetime)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Gauge className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500">Opening Odometer</p>
                  <p className="text-[13px] font-medium text-slate-800">
                    {trip.opening_odometer != null ? `${trip.opening_odometer} km` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Arrival Form */}
          <div className="space-y-4">
            {/* Arrival Date Time */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Arrival Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.arrival_datetime}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, arrival_datetime: e.target.value }));
                  if (errors.arrival_datetime) setErrors((prev) => ({ ...prev, arrival_datetime: undefined }));
                }}
                className={`w-full px-3 py-2.5 border rounded-lg text-[13px] focus:outline-none focus:ring-2 transition-all ${
                  errors.arrival_datetime
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
                }`}
              />
              {errors.arrival_datetime && (
                <p className="mt-1 text-[12px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.arrival_datetime}
                </p>
              )}
            </div>

            {/* Closing Odometer */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Closing Odometer (km) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter odometer reading"
                  value={form.closing_odometer}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, closing_odometer: e.target.value }));
                    if (errors.closing_odometer) setErrors((prev) => ({ ...prev, closing_odometer: undefined }));
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-[13px] focus:outline-none focus:ring-2 transition-all ${
                    errors.closing_odometer
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
                  }`}
                />
              </div>
              {errors.closing_odometer ? (
                <p className="mt-1 text-[12px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.closing_odometer}
                </p>
              ) : trip.opening_odometer != null && (
                <p className="mt-1 text-[11px] text-gray-400">
                  Must be greater than opening odometer: {trip.opening_odometer} km
                </p>
              )}
            </div>

            {/* Status (read-only) */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                New Vehicle Status
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-[13px] font-medium text-emerald-800">{newVehicleStatus}</span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                Vehicle and trip will be marked as completed upon submission.
              </p>
            </div>

            {/* POD Upload */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Proof of Delivery (POD)
                <span className="ml-1.5 text-[11px] font-normal text-gray-400">Optional</span>
              </label>
              {form.pod_file ? (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-[13px] text-blue-800 flex-1 truncate">{form.pod_file.name}</span>
                  <span className="text-[11px] text-blue-500 flex-shrink-0">
                    {(form.pod_file.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="p-1 text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-500 hover:text-blue-600"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-[13px]">Click to upload POD document</span>
                  <span className="text-[11px] text-gray-400">PDF, JPG, PNG up to 10 MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Error Banner */}
          {saveError && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-700">{saveError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all disabled:opacity-60 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm Arrival
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
