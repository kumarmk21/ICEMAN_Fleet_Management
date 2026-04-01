import { useState, useEffect } from 'react';
import {
  X, FileText, Building2, User, MapPin, Truck, Package,
  IndianRupee, Calendar, Tag, ChevronDown, ChevronUp, Save,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LREntryModalProps {
  trip: any;
  driverName: string;
  vehicleName: string;
  customerName: string;
  onClose: () => void;
}

interface LRForm {
  lr_no: string;
  lr_date: string;
  lr_type: string;
  company_code: string;
  branch_code: string;
  financial_year: string;
  customer_code: string;
  customer_name: string;
  billing_party_code: string;
  billing_party_name: string;
  consignor_name: string;
  consignor_address: string;
  consignor_gstin: string;
  consignor_contact_no: string;
  consignee_name: string;
  consignee_address: string;
  consignee_gstin: string;
  consignee_contact_no: string;
  from_location_name: string;
  to_location_name: string;
  trip_no: string;
  trip_date: string;
  vehicle_no: string;
  vehicle_type: string;
  fleet_type: string;
  driver_name: string;
  driver_mobile: string;
  movement_type: string;
  service_type: string;
  transport_mode: string;
  payment_basis: string;
  booking_type: string;
  commodity_code: string;
  commodity_name: string;
  package_type: string;
  no_of_packages: string;
  actual_weight_kg: string;
  charged_weight_kg: string;
  declared_value: string;
  invoice_value: string;
  description_of_goods: string;
  invoice_no: string;
  invoice_date: string;
  po_no: string;
  po_date: string;
  ewaybill_no: string;
  ewaybill_date: string;
  ewaybill_valid_upto: string;
  delivery_challan_no: string;
  delivery_challan_date: string;
  docket_ref_no: string;
  rate_type: string;
  freight_amount: string;
  loading_charges: string;
  unloading_charges: string;
  detention_charges: string;
  halting_charges: string;
  oda_charges: string;
  fuel_surcharge: string;
  misc_charges: string;
  discount_amount: string;
  cgst_amount: string;
  sgst_amount: string;
  igst_amount: string;
  lr_status: string;
  billing_status: string;
  pod_status: string;
  dispatch_date: string;
  expected_delivery_date: string;
  remarks: string;
  delivery_remarks: string;
  exception_reason: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function calcFinancials(form: LRForm) {
  const n = (v: string) => parseFloat(v) || 0;
  const taxable =
    n(form.freight_amount) +
    n(form.loading_charges) +
    n(form.unloading_charges) +
    n(form.detention_charges) +
    n(form.halting_charges) +
    n(form.oda_charges) +
    n(form.fuel_surcharge) +
    n(form.misc_charges) -
    n(form.discount_amount);
  const gst = n(form.cgst_amount) + n(form.sgst_amount) + n(form.igst_amount);
  return {
    taxable_amount: Math.max(0, taxable),
    total_amount: Math.max(0, taxable + gst),
  };
}

async function generateSystemLRNo(): Promise<string> {
  const { data } = await supabase
    .from('fm_lorry_receipt')
    .select('lr_no')
    .like('lr_no', 'IM%')
    .order('lr_no', { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const parsed = parseInt(data[0].lr_no.replace(/^IM/i, ''), 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }
  return `IM${String(nextNum).padStart(5, '0')}`;
}

export function LREntryModal({ trip, driverName, vehicleName, customerName, onClose }: LREntryModalProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generatingNo, setGeneratingNo] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identity: true,
    party: true,
    consignor: true,
    consignee: true,
    route: true,
    service: false,
    commodity: true,
    references: true,
    charges: true,
    status: false,
    remarks: false,
  });

  const [form, setForm] = useState<LRForm>({
    lr_no: '',
    lr_date: todayISO(),
    lr_type: 'MANUAL',
    company_code: '',
    branch_code: '',
    financial_year: '',
    customer_code: '',
    customer_name: customerName || '',
    billing_party_code: '',
    billing_party_name: '',
    consignor_name: '',
    consignor_address: '',
    consignor_gstin: '',
    consignor_contact_no: '',
    consignee_name: '',
    consignee_address: '',
    consignee_gstin: '',
    consignee_contact_no: '',
    from_location_name: trip?.origin || '',
    to_location_name: trip?.destination || '',
    trip_no: trip?.trip_number || '',
    trip_date: trip?.planned_start_datetime?.slice(0, 10) || todayISO(),
    vehicle_no: vehicleName || '',
    vehicle_type: '',
    fleet_type: '',
    driver_name: driverName || '',
    driver_mobile: '',
    movement_type: '',
    service_type: '',
    transport_mode: 'ROAD',
    payment_basis: 'TO_PAY',
    booking_type: '',
    commodity_code: '',
    commodity_name: trip?.load_type || '',
    package_type: '',
    no_of_packages: '0',
    actual_weight_kg: '0',
    charged_weight_kg: '0',
    declared_value: '0',
    invoice_value: '0',
    description_of_goods: '',
    invoice_no: '',
    invoice_date: '',
    po_no: '',
    po_date: '',
    ewaybill_no: '',
    ewaybill_date: '',
    ewaybill_valid_upto: '',
    delivery_challan_no: '',
    delivery_challan_date: '',
    docket_ref_no: '',
    rate_type: 'PER_TRIP',
    freight_amount: trip?.freight_revenue ? String(trip.freight_revenue) : '0',
    loading_charges: '0',
    unloading_charges: '0',
    detention_charges: '0',
    halting_charges: '0',
    oda_charges: '0',
    fuel_surcharge: '0',
    misc_charges: '0',
    discount_amount: '0',
    cgst_amount: '0',
    sgst_amount: '0',
    igst_amount: '0',
    lr_status: 'OPEN',
    billing_status: 'PENDING',
    pod_status: 'PENDING',
    dispatch_date: '',
    expected_delivery_date: '',
    remarks: trip?.remarks || '',
    delivery_remarks: '',
    exception_reason: '',
  });

  const { taxable_amount, total_amount } = calcFinancials(form);

  useEffect(() => {
    if (form.lr_type === 'SYSTEM') {
      setGeneratingNo(true);
      generateSystemLRNo()
        .then((no) => setForm((prev) => ({ ...prev, lr_no: no })))
        .finally(() => setGeneratingNo(false));
    } else {
      setForm((prev) => ({ ...prev, lr_no: '' }));
    }
  }, [form.lr_type]);

  function f(key: keyof LRForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lr_no.trim()) { alert('LR Number is mandatory'); return; }
    if (!form.customer_name.trim()) { alert('Customer Name is mandatory'); return; }
    if (!form.consignor_name.trim()) { alert('Consignor Name is mandatory'); return; }
    if (!form.consignee_name.trim()) { alert('Consignee Name is mandatory'); return; }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const createdBy = userData?.user?.email || 'system';

      const payload = {
        lr_no: form.lr_no.trim(),
        lr_date: form.lr_date ? new Date(form.lr_date).toISOString() : new Date().toISOString(),
        lr_type: form.lr_type || null,
        company_code: form.company_code || '',
        branch_code: form.branch_code || '',
        financial_year: form.financial_year || null,
        customer_code: form.customer_code || '',
        customer_name: form.customer_name,
        billing_party_code: form.billing_party_code || null,
        billing_party_name: form.billing_party_name || null,
        consignor_name: form.consignor_name,
        consignor_address: form.consignor_address || null,
        consignor_gstin: form.consignor_gstin || null,
        consignor_contact_no: form.consignor_contact_no || null,
        consignee_name: form.consignee_name,
        consignee_address: form.consignee_address || null,
        consignee_gstin: form.consignee_gstin || null,
        consignee_contact_no: form.consignee_contact_no || null,
        from_location_name: form.from_location_name,
        to_location_name: form.to_location_name,
        trip_no: form.trip_no || null,
        trip_date: form.trip_date ? new Date(form.trip_date).toISOString() : null,
        vehicle_no: form.vehicle_no || null,
        vehicle_type: form.vehicle_type || null,
        fleet_type: form.fleet_type || null,
        driver_name: form.driver_name || null,
        driver_mobile: form.driver_mobile || null,
        movement_type: form.movement_type || null,
        service_type: form.service_type || null,
        transport_mode: form.transport_mode || null,
        payment_basis: form.payment_basis || null,
        booking_type: form.booking_type || null,
        commodity_code: form.commodity_code || null,
        commodity_name: form.commodity_name || null,
        package_type: form.package_type || null,
        no_of_packages: parseInt(form.no_of_packages) || 0,
        actual_weight_kg: parseFloat(form.actual_weight_kg) || 0,
        charged_weight_kg: parseFloat(form.charged_weight_kg) || 0,
        declared_value: parseFloat(form.declared_value) || 0,
        invoice_value: parseFloat(form.invoice_value) || 0,
        description_of_goods: form.description_of_goods || null,
        invoice_no: form.invoice_no || null,
        invoice_date: form.invoice_date || null,
        po_no: form.po_no || null,
        po_date: form.po_date || null,
        ewaybill_no: form.ewaybill_no || null,
        ewaybill_date: form.ewaybill_date || null,
        ewaybill_valid_upto: form.ewaybill_valid_upto
          ? new Date(form.ewaybill_valid_upto).toISOString()
          : null,
        delivery_challan_no: form.delivery_challan_no || null,
        delivery_challan_date: form.delivery_challan_date || null,
        docket_ref_no: form.docket_ref_no || null,
        rate_type: form.rate_type || null,
        freight_amount: parseFloat(form.freight_amount) || 0,
        loading_charges: parseFloat(form.loading_charges) || 0,
        unloading_charges: parseFloat(form.unloading_charges) || 0,
        detention_charges: parseFloat(form.detention_charges) || 0,
        halting_charges: parseFloat(form.halting_charges) || 0,
        oda_charges: parseFloat(form.oda_charges) || 0,
        fuel_surcharge: parseFloat(form.fuel_surcharge) || 0,
        misc_charges: parseFloat(form.misc_charges) || 0,
        discount_amount: parseFloat(form.discount_amount) || 0,
        taxable_amount,
        cgst_amount: parseFloat(form.cgst_amount) || 0,
        sgst_amount: parseFloat(form.sgst_amount) || 0,
        igst_amount: parseFloat(form.igst_amount) || 0,
        total_amount,
        lr_status: form.lr_status,
        billing_status: form.billing_status,
        pod_status: form.pod_status,
        dispatch_date: form.dispatch_date ? new Date(form.dispatch_date).toISOString() : null,
        expected_delivery_date: form.expected_delivery_date
          ? new Date(form.expected_delivery_date).toISOString()
          : null,
        remarks: form.remarks || null,
        delivery_remarks: form.delivery_remarks || null,
        exception_reason: form.exception_reason || null,
        created_by: createdBy,
        created_on: new Date().toISOString(),
        is_active: true,
        is_deleted: false,
      };

      const { error } = await supabase.from('fm_lorry_receipt').insert(payload);
      if (error) throw error;
      setSaved(true);
    } catch (err: any) {
      alert(`Failed to save LR: ${err?.message || JSON.stringify(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white bg-opacity-15 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Lorry Receipt Entry</h2>
              <p className="text-slate-300 text-xs">Trip: {trip?.trip_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saved ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Save className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">LR Saved Successfully</h3>
            <p className="text-gray-500 text-sm">LR No: <span className="font-semibold text-gray-800">{form.lr_no}</span></p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">

              {/* Section 1: LR Identity */}
              <Section
                title="LR Identity"
                icon={<Tag className="w-4 h-4" />}
                open={openSections.identity}
                onToggle={() => toggleSection('identity')}
                color="slate"
              >
                <div className="space-y-5">
                  {/* LR Type Radio — first */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wide">
                      LR Type <span className="text-red-500">*</span>
                    </p>
                    <div className="flex items-center gap-6">
                      {(['MANUAL', 'SYSTEM'] as const).map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                            form.lr_type === opt
                              ? opt === 'SYSTEM'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-600 bg-slate-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="lr_type"
                            value={opt}
                            checked={form.lr_type === opt}
                            onChange={() => f('lr_type', opt)}
                            className="accent-slate-700 w-4 h-4"
                          />
                          <span className={`text-sm font-semibold ${form.lr_type === opt ? (opt === 'SYSTEM' ? 'text-blue-700' : 'text-slate-800') : 'text-gray-500'}`}>
                            {opt === 'MANUAL' ? 'Manual' : 'System'}
                          </span>
                          {opt === 'SYSTEM' && (
                            <span className="text-[10px] text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded font-medium">Auto-generated</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* LR Number — conditional */}
                    <Field label="LR Number" required>
                      {form.lr_type === 'SYSTEM' ? (
                        <div className={`${inputCls} bg-slate-50 text-slate-700 font-mono font-semibold flex items-center gap-2`}>
                          {generatingNo ? (
                            <span className="text-slate-400 text-xs">Generating...</span>
                          ) : (
                            <span>{form.lr_no || '—'}</span>
                          )}
                          <span className="ml-auto text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">Read-only</span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={form.lr_no}
                          onChange={(e) => f('lr_no', e.target.value)}
                          placeholder="Enter LR Number"
                          required
                          className={inputCls}
                        />
                      )}
                    </Field>

                    <Field label="LR Date" required>
                      <input type="date" value={form.lr_date} onChange={(e) => f('lr_date', e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Company Code">
                      <input type="text" value={form.company_code} onChange={(e) => f('company_code', e.target.value)} placeholder="Company code" className={inputCls} />
                    </Field>
                    <Field label="Branch Code">
                      <input type="text" value={form.branch_code} onChange={(e) => f('branch_code', e.target.value)} placeholder="Branch code" className={inputCls} />
                    </Field>
                    <Field label="Financial Year">
                      <input type="text" value={form.financial_year} onChange={(e) => f('financial_year', e.target.value)} placeholder="2025-26" className={inputCls} />
                    </Field>
                  </div>
                </div>
              </Section>

              {/* Section 2: Party Information */}
              <Section
                title="Party Information"
                icon={<Building2 className="w-4 h-4" />}
                open={openSections.party}
                onToggle={() => toggleSection('party')}
                color="blue"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Customer / Billed Party</p>
                    <Field label="Customer Code">
                      <input type="text" value={form.customer_code} onChange={(e) => f('customer_code', e.target.value)} placeholder="Customer code" className={inputCls} />
                    </Field>
                    <Field label="Customer Name" required>
                      <input type="text" value={form.customer_name} onChange={(e) => f('customer_name', e.target.value)} placeholder="Customer name" className={inputCls} />
                    </Field>
                  </div>
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Billing Party (if different)</p>
                    <Field label="Billing Party Code">
                      <input type="text" value={form.billing_party_code} onChange={(e) => f('billing_party_code', e.target.value)} placeholder="Billing party code" className={inputCls} />
                    </Field>
                    <Field label="Billing Party Name">
                      <input type="text" value={form.billing_party_name} onChange={(e) => f('billing_party_name', e.target.value)} placeholder="Billing party name" className={inputCls} />
                    </Field>
                  </div>
                </div>
              </Section>

              {/* Section 3: Consignor & Consignee */}
              <Section
                title="Consignor & Consignee"
                icon={<User className="w-4 h-4" />}
                open={openSections.consignor}
                onToggle={() => toggleSection('consignor')}
                color="green"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Consignor */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-[10px] font-bold">F</span>
                      Consignor (Sender)
                    </p>
                    <Field label="Consignor Name" required>
                      <input type="text" value={form.consignor_name} onChange={(e) => f('consignor_name', e.target.value)} placeholder="Sender's name" className={inputCls} />
                    </Field>
                    <Field label="Address">
                      <textarea value={form.consignor_address} onChange={(e) => f('consignor_address', e.target.value)} rows={2} placeholder="Full address" className={`${inputCls} resize-none`} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="GSTIN">
                        <input type="text" value={form.consignor_gstin} onChange={(e) => f('consignor_gstin', e.target.value.toUpperCase())} placeholder="15-digit GSTIN" maxLength={15} className={inputCls} />
                      </Field>
                      <Field label="Contact No.">
                        <input type="text" value={form.consignor_contact_no} onChange={(e) => f('consignor_contact_no', e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputCls} />
                      </Field>
                    </div>
                  </div>
                  {/* Consignee */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">T</span>
                      Consignee (Receiver)
                    </p>
                    <Field label="Consignee Name" required>
                      <input type="text" value={form.consignee_name} onChange={(e) => f('consignee_name', e.target.value)} placeholder="Receiver's name" className={inputCls} />
                    </Field>
                    <Field label="Address">
                      <textarea value={form.consignee_address} onChange={(e) => f('consignee_address', e.target.value)} rows={2} placeholder="Full address" className={`${inputCls} resize-none`} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="GSTIN">
                        <input type="text" value={form.consignee_gstin} onChange={(e) => f('consignee_gstin', e.target.value.toUpperCase())} placeholder="15-digit GSTIN" maxLength={15} className={inputCls} />
                      </Field>
                      <Field label="Contact No.">
                        <input type="text" value={form.consignee_contact_no} onChange={(e) => f('consignee_contact_no', e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputCls} />
                      </Field>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Section 4: Route & Trip */}
              <Section
                title="Route & Trip Details"
                icon={<MapPin className="w-4 h-4" />}
                open={openSections.route}
                onToggle={() => toggleSection('route')}
                color="orange"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="From Location" required>
                    <input type="text" value={form.from_location_name} onChange={(e) => f('from_location_name', e.target.value)} placeholder="Origin city" className={inputCls} />
                  </Field>
                  <Field label="To Location" required>
                    <input type="text" value={form.to_location_name} onChange={(e) => f('to_location_name', e.target.value)} placeholder="Destination city" className={inputCls} />
                  </Field>
                  <Field label="Trip No.">
                    <input type="text" value={form.trip_no} onChange={(e) => f('trip_no', e.target.value)} className={`${inputCls} bg-gray-50 text-gray-600`} readOnly />
                  </Field>
                  <Field label="Trip Date">
                    <input type="date" value={form.trip_date} onChange={(e) => f('trip_date', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Vehicle No.">
                    <input type="text" value={form.vehicle_no} onChange={(e) => f('vehicle_no', e.target.value)} placeholder="Vehicle number" className={inputCls} />
                  </Field>
                  <Field label="Vehicle Type">
                    <input type="text" value={form.vehicle_type} onChange={(e) => f('vehicle_type', e.target.value)} placeholder="e.g. 12 Ton" className={inputCls} />
                  </Field>
                  <Field label="Fleet Type">
                    <select value={form.fleet_type} onChange={(e) => f('fleet_type', e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      <option value="OWN">Own</option>
                      <option value="MARKET">Market</option>
                      <option value="ATTACHED">Attached</option>
                    </select>
                  </Field>
                  <Field label="Driver Name">
                    <input type="text" value={form.driver_name} onChange={(e) => f('driver_name', e.target.value)} placeholder="Driver name" className={inputCls} />
                  </Field>
                  <Field label="Driver Mobile">
                    <input type="text" value={form.driver_mobile} onChange={(e) => f('driver_mobile', e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputCls} />
                  </Field>
                </div>
              </Section>

              {/* Section 5: Service Details */}
              <Section
                title="Service Details"
                icon={<Truck className="w-4 h-4" />}
                open={openSections.service}
                onToggle={() => toggleSection('service')}
                color="slate"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Movement Type">
                    <select value={form.movement_type} onChange={(e) => f('movement_type', e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      <option value="FTL">FTL</option>
                      <option value="LTL">LTL</option>
                      <option value="PART_LOAD">Part Load</option>
                    </select>
                  </Field>
                  <Field label="Service Type">
                    <select value={form.service_type} onChange={(e) => f('service_type', e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      <option value="DOOR_TO_DOOR">Door to Door</option>
                      <option value="DOOR_TO_DEPOT">Door to Depot</option>
                      <option value="DEPOT_TO_DOOR">Depot to Door</option>
                      <option value="DEPOT_TO_DEPOT">Depot to Depot</option>
                    </select>
                  </Field>
                  <Field label="Transport Mode">
                    <select value={form.transport_mode} onChange={(e) => f('transport_mode', e.target.value)} className={inputCls}>
                      <option value="ROAD">Road</option>
                      <option value="RAIL">Rail</option>
                      <option value="AIR">Air</option>
                      <option value="SEA">Sea</option>
                    </select>
                  </Field>
                  <Field label="Payment Basis">
                    <select value={form.payment_basis} onChange={(e) => f('payment_basis', e.target.value)} className={inputCls}>
                      <option value="TO_PAY">To Pay</option>
                      <option value="PAID">Paid</option>
                      <option value="TBB">TBB</option>
                      <option value="COD">COD</option>
                    </select>
                  </Field>
                  <Field label="Booking Type">
                    <select value={form.booking_type} onChange={(e) => f('booking_type', e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      <option value="DIRECT">Direct</option>
                      <option value="PICKUP">Pickup</option>
                    </select>
                  </Field>
                </div>
              </Section>

              {/* Section 6: Commodity & Shipment */}
              <Section
                title="Commodity & Shipment"
                icon={<Package className="w-4 h-4" />}
                open={openSections.commodity}
                onToggle={() => toggleSection('commodity')}
                color="teal"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Commodity Code">
                    <input type="text" value={form.commodity_code} onChange={(e) => f('commodity_code', e.target.value)} placeholder="HSN / commodity code" className={inputCls} />
                  </Field>
                  <Field label="Commodity Name">
                    <input type="text" value={form.commodity_name} onChange={(e) => f('commodity_name', e.target.value)} placeholder="e.g. Steel Coils" className={inputCls} />
                  </Field>
                  <Field label="Package Type">
                    <input type="text" value={form.package_type} onChange={(e) => f('package_type', e.target.value)} placeholder="e.g. Bags, Boxes, Cartons" className={inputCls} />
                  </Field>
                  <Field label="No. of Packages">
                    <input type="number" min="0" value={form.no_of_packages} onChange={(e) => f('no_of_packages', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Actual Weight (KG)">
                    <input type="number" step="0.001" min="0" value={form.actual_weight_kg} onChange={(e) => f('actual_weight_kg', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Charged Weight (KG)">
                    <input type="number" step="0.001" min="0" value={form.charged_weight_kg} onChange={(e) => f('charged_weight_kg', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Declared Value (₹)">
                    <input type="number" step="0.01" min="0" value={form.declared_value} onChange={(e) => f('declared_value', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Invoice Value (₹)">
                    <input type="number" step="0.01" min="0" value={form.invoice_value} onChange={(e) => f('invoice_value', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Description of Goods" span>
                    <input type="text" value={form.description_of_goods} onChange={(e) => f('description_of_goods', e.target.value)} placeholder="Brief description of the goods" className={inputCls} />
                  </Field>
                </div>
              </Section>

              {/* Section 7: Reference Documents */}
              <Section
                title="Reference Documents"
                icon={<FileText className="w-4 h-4" />}
                open={openSections.references}
                onToggle={() => toggleSection('references')}
                color="amber"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Invoice No.">
                    <input type="text" value={form.invoice_no} onChange={(e) => f('invoice_no', e.target.value)} placeholder="Invoice number" className={inputCls} />
                  </Field>
                  <Field label="Invoice Date">
                    <input type="date" value={form.invoice_date} onChange={(e) => f('invoice_date', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="PO No.">
                    <input type="text" value={form.po_no} onChange={(e) => f('po_no', e.target.value)} placeholder="Purchase order no." className={inputCls} />
                  </Field>
                  <Field label="PO Date">
                    <input type="date" value={form.po_date} onChange={(e) => f('po_date', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="E-Way Bill No.">
                    <input type="text" value={form.ewaybill_no} onChange={(e) => f('ewaybill_no', e.target.value)} placeholder="12-digit EWB number" className={inputCls} />
                  </Field>
                  <Field label="E-Way Bill Date">
                    <input type="date" value={form.ewaybill_date} onChange={(e) => f('ewaybill_date', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="E-Way Bill Valid Upto">
                    <input type="datetime-local" value={form.ewaybill_valid_upto} onChange={(e) => f('ewaybill_valid_upto', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Delivery Challan No.">
                    <input type="text" value={form.delivery_challan_no} onChange={(e) => f('delivery_challan_no', e.target.value)} placeholder="DC number" className={inputCls} />
                  </Field>
                  <Field label="DC Date">
                    <input type="date" value={form.delivery_challan_date} onChange={(e) => f('delivery_challan_date', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Docket Ref. No.">
                    <input type="text" value={form.docket_ref_no} onChange={(e) => f('docket_ref_no', e.target.value)} placeholder="Docket reference" className={inputCls} />
                  </Field>
                </div>
              </Section>

              {/* Section 8: Charges & Financials */}
              <Section
                title="Charges & Financials"
                icon={<IndianRupee className="w-4 h-4" />}
                open={openSections.charges}
                onToggle={() => toggleSection('charges')}
                color="green"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Rate Type">
                      <select value={form.rate_type} onChange={(e) => f('rate_type', e.target.value)} className={inputCls}>
                        <option value="PER_TRIP">Per Trip</option>
                        <option value="PER_KG">Per KG</option>
                        <option value="PER_TON">Per Ton</option>
                        <option value="PER_CFT">Per CFT</option>
                        <option value="FIXED">Fixed</option>
                      </select>
                    </Field>
                    <Field label="Freight Amount (₹)">
                      <AmountInput value={form.freight_amount} onChange={(v) => f('freight_amount', v)} />
                    </Field>
                    <Field label="Loading Charges (₹)">
                      <AmountInput value={form.loading_charges} onChange={(v) => f('loading_charges', v)} />
                    </Field>
                    <Field label="Unloading Charges (₹)">
                      <AmountInput value={form.unloading_charges} onChange={(v) => f('unloading_charges', v)} />
                    </Field>
                    <Field label="Detention Charges (₹)">
                      <AmountInput value={form.detention_charges} onChange={(v) => f('detention_charges', v)} />
                    </Field>
                    <Field label="Halting Charges (₹)">
                      <AmountInput value={form.halting_charges} onChange={(v) => f('halting_charges', v)} />
                    </Field>
                    <Field label="ODA Charges (₹)">
                      <AmountInput value={form.oda_charges} onChange={(v) => f('oda_charges', v)} />
                    </Field>
                    <Field label="Fuel Surcharge (₹)">
                      <AmountInput value={form.fuel_surcharge} onChange={(v) => f('fuel_surcharge', v)} />
                    </Field>
                    <Field label="Misc. Charges (₹)">
                      <AmountInput value={form.misc_charges} onChange={(v) => f('misc_charges', v)} />
                    </Field>
                    <Field label="Discount (₹)">
                      <AmountInput value={form.discount_amount} onChange={(v) => f('discount_amount', v)} />
                    </Field>
                  </div>

                  {/* GST */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="col-span-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">GST Amounts</p>
                    <Field label="CGST (₹)">
                      <AmountInput value={form.cgst_amount} onChange={(v) => f('cgst_amount', v)} />
                    </Field>
                    <Field label="SGST (₹)">
                      <AmountInput value={form.sgst_amount} onChange={(v) => f('sgst_amount', v)} />
                    </Field>
                    <Field label="IGST (₹)">
                      <AmountInput value={form.igst_amount} onChange={(v) => f('igst_amount', v)} />
                    </Field>
                  </div>

                  {/* Calculated totals */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Taxable Amount</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(taxable_amount)}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Total Amount (Incl. GST)</p>
                      <p className="text-2xl font-bold text-green-800">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Section 9: Status & Dates */}
              <Section
                title="Status & Operational Dates"
                icon={<Calendar className="w-4 h-4" />}
                open={openSections.status}
                onToggle={() => toggleSection('status')}
                color="slate"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="LR Status">
                    <select value={form.lr_status} onChange={(e) => f('lr_status', e.target.value)} className={inputCls}>
                      <option value="OPEN">Open</option>
                      <option value="CLOSED">Closed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </Field>
                  <Field label="Billing Status">
                    <select value={form.billing_status} onChange={(e) => f('billing_status', e.target.value)} className={inputCls}>
                      <option value="PENDING">Pending</option>
                      <option value="BILLED">Billed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </Field>
                  <Field label="POD Status">
                    <select value={form.pod_status} onChange={(e) => f('pod_status', e.target.value)} className={inputCls}>
                      <option value="PENDING">Pending</option>
                      <option value="RECEIVED">Received</option>
                      <option value="WAIVED">Waived</option>
                    </select>
                  </Field>
                  <Field label="Dispatch Date">
                    <input type="datetime-local" value={form.dispatch_date} onChange={(e) => f('dispatch_date', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Expected Delivery Date">
                    <input type="datetime-local" value={form.expected_delivery_date} onChange={(e) => f('expected_delivery_date', e.target.value)} className={inputCls} />
                  </Field>
                </div>
              </Section>

              {/* Section 10: Remarks */}
              <Section
                title="Remarks"
                icon={<FileText className="w-4 h-4" />}
                open={openSections.remarks}
                onToggle={() => toggleSection('remarks')}
                color="gray"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Remarks">
                    <textarea value={form.remarks} onChange={(e) => f('remarks', e.target.value)} rows={3} placeholder="General remarks" className={`${inputCls} resize-none`} />
                  </Field>
                  <Field label="Delivery Remarks">
                    <textarea value={form.delivery_remarks} onChange={(e) => f('delivery_remarks', e.target.value)} rows={3} placeholder="Delivery remarks" className={`${inputCls} resize-none`} />
                  </Field>
                  <Field label="Exception Reason">
                    <textarea value={form.exception_reason} onChange={(e) => f('exception_reason', e.target.value)} rows={3} placeholder="Exception / discrepancy reason" className={`${inputCls} resize-none`} />
                  </Field>
                </div>
              </Section>

            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-sm transition-colors disabled:bg-slate-400"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving LR...' : 'Save Lorry Receipt'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm bg-white';

const sectionColors: Record<string, { header: string; border: string }> = {
  slate: { header: 'bg-slate-700', border: 'border-slate-200' },
  blue: { header: 'bg-blue-600', border: 'border-blue-200' },
  green: { header: 'bg-emerald-600', border: 'border-emerald-200' },
  orange: { header: 'bg-orange-500', border: 'border-orange-200' },
  teal: { header: 'bg-teal-600', border: 'border-teal-200' },
  amber: { header: 'bg-amber-600', border: 'border-amber-200' },
  gray: { header: 'bg-gray-600', border: 'border-gray-200' },
};

function Section({
  title, icon, open, onToggle, children, color = 'slate',
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  const { header, border } = sectionColors[color] || sectionColors.slate;
  return (
    <div className={`rounded-xl border ${border} overflow-hidden`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-3 ${header} text-white hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-2.5">
          <span className="opacity-80">{icon}</span>
          <span className="font-semibold text-sm tracking-wide">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
      </button>
      {open && <div className="p-5 bg-white">{children}</div>}
    </div>
  );
}

function Field({
  label, required, children, span,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <div className={span ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-500 normal-case">*</span>}
      </label>
      {children}
    </div>
  );
}

function AmountInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm bg-white"
      />
    </div>
  );
}
