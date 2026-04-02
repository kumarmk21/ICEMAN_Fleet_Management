import { useEffect, useState } from 'react';
import { X, Printer, FileDown, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FullLR {
  lr_id: string;
  lr_no: string;
  lr_date: string | null;
  lr_type: string | null;
  company_code: string | null;
  branch_code: string | null;
  financial_year: string | null;
  customer_code: string | null;
  customer_name: string;
  billing_party_code: string | null;
  billing_party_name: string | null;
  consignor_name: string;
  consignor_address: string | null;
  consignor_gstin: string | null;
  consignor_contact_no: string | null;
  consignee_name: string;
  consignee_address: string | null;
  consignee_gstin: string | null;
  consignee_contact_no: string | null;
  from_location_name: string;
  to_location_name: string;
  trip_no: string | null;
  trip_date: string | null;
  vehicle_no: string | null;
  vehicle_type: string | null;
  fleet_type: string | null;
  driver_name: string | null;
  driver_mobile: string | null;
  movement_type: string | null;
  service_type: string | null;
  transport_mode: string | null;
  payment_basis: string | null;
  booking_type: string | null;
  commodity_code: string | null;
  commodity_name: string | null;
  package_type: string | null;
  no_of_packages: number;
  actual_weight_kg: number;
  charged_weight_kg: number;
  declared_value: number;
  invoice_value: number;
  description_of_goods: string | null;
  invoice_no: string | null;
  invoice_date: string | null;
  po_no: string | null;
  po_date: string | null;
  ewaybill_no: string | null;
  ewaybill_date: string | null;
  ewaybill_valid_upto: string | null;
  delivery_challan_no: string | null;
  delivery_challan_date: string | null;
  docket_ref_no: string | null;
  rate_type: string | null;
  freight_amount: number;
  loading_charges: number;
  unloading_charges: number;
  detention_charges: number;
  halting_charges: number;
  oda_charges: number;
  fuel_surcharge: number;
  misc_charges: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  lr_status: string;
  billing_status: string;
  pod_status: string;
  dispatch_date: string | null;
  expected_delivery_date: string | null;
  remarks: string | null;
  delivery_remarks: string | null;
  exception_reason: string | null;
}

interface LRPrintModalProps {
  lrId: string;
  onClose: () => void;
}

const COMPANY = {
  name: 'ICEMAN WAREHOUSING & LOGISTICS PRIVATE LIMITED',
  address: '28/5, TTC Industrial Area, MIDC Industrial Area, Turbhe,',
  city: 'Navi Mumbai, Maharashtra 400703',
  logo: '/iceman.jpg',
};

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtAmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

const v = (val: string | number | null | undefined) => (val != null && val !== '' ? String(val) : '—');

export function LRPrintModal({ lrId, onClose }: LRPrintModalProps) {
  const [lr, setLR] = useState<FullLR | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('fm_lorry_receipt')
      .select('*')
      .eq('lr_id', lrId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setLR(data as FullLR);
        setLoading(false);
      });
  }, [lrId]);

  function handlePrint(downloadPDF = false) {
    if (!lr) return;
    const logoUrl = `${window.location.origin}/iceman.jpg`;
    const win = window.open('', '_blank', 'width=1000,height=1200');
    if (!win) return;

    const chargeRows = [
      ['Freight', lr.freight_amount],
      ['Loading', lr.loading_charges],
      ['Unloading', lr.unloading_charges],
      ['Detention', lr.detention_charges],
      ['Halting', lr.halting_charges],
      ['ODA', lr.oda_charges],
      ['Fuel Surcharge', lr.fuel_surcharge],
      ['Misc. Charges', lr.misc_charges],
      ['Discount', lr.discount_amount],
    ]
      .filter(([, amt]) => (amt as number) > 0)
      .map(
        ([label, amt]) =>
          `<tr><td class="charge-label">${label}</td><td class="charge-amt">${fmtAmt(amt as number)}</td></tr>`,
      )
      .join('');

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>LR - ${lr.lr_no}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; font-size: 11px; color: #111; background: #fff; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 10mm 12mm; }

  /* Header */
  .header { display: flex; align-items: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 8px; margin-bottom: 8px; }
  .logo { width: 72px; height: 72px; object-fit: contain; margin-right: 14px; flex-shrink: 0; }
  .company-info { flex: 1; }
  .company-name { font-size: 16px; font-weight: 900; color: #1e3a5f; letter-spacing: 0.5px; line-height: 1.2; }
  .company-addr { font-size: 10px; color: #444; margin-top: 3px; line-height: 1.5; }
  .lr-badge { text-align: right; }
  .lr-title { font-size: 20px; font-weight: 900; color: #1e3a5f; letter-spacing: 2px; }
  .lr-no-box { margin-top: 4px; background: #1e3a5f; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 700; letter-spacing: 1px; display: inline-block; }

  /* Identity row */
  .identity-bar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; background: #f0f4f8; border: 1px solid #d0dce8; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; }
  .id-item { }
  .id-label { font-size: 8.5px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  .id-value { font-size: 11px; font-weight: 600; color: #1a1a1a; margin-top: 2px; }

  /* Section */
  .section-title { font-size: 9px; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 1px; background: #1e3a5f; padding: 3px 8px; border-radius: 3px 3px 0 0; display: inline-block; margin-bottom: -1px; }

  /* Party grid */
  .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .party-box { border: 1px solid #d0dce8; border-radius: 6px; overflow: hidden; }
  .party-header { background: #e8eef5; padding: 4px 10px; font-size: 9px; font-weight: 800; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #d0dce8; }
  .party-body { padding: 8px 10px; }
  .party-name { font-size: 12px; font-weight: 700; color: #1a1a1a; }
  .party-detail { font-size: 10px; color: #444; margin-top: 2px; line-height: 1.4; }
  .party-gstin { font-size: 9.5px; color: #555; font-family: monospace; margin-top: 3px; }

  /* Route */
  .route-box { border: 1px solid #d0dce8; border-radius: 6px; overflow: hidden; margin-bottom: 8px; }
  .route-inner { padding: 8px 10px; display: flex; align-items: center; gap: 10px; }
  .route-city { flex: 1; text-align: center; }
  .route-city-label { font-size: 8.5px; color: #666; font-weight: 700; text-transform: uppercase; }
  .route-city-name { font-size: 14px; font-weight: 800; color: #1e3a5f; margin-top: 2px; }
  .route-arrow { font-size: 22px; color: #1e3a5f; font-weight: 900; }

  /* Table */
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { background: #1e3a5f; color: #fff; padding: 5px 8px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
  td { padding: 5px 8px; font-size: 10.5px; border-bottom: 1px solid #e5e9ee; color: #1a1a1a; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f8fafc; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }

  /* Charges */
  .charges-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .charges-table { border: 1px solid #d0dce8; border-radius: 6px; overflow: hidden; }
  .charges-header { background: #1e3a5f; color: #fff; padding: 4px 8px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
  .charge-label { padding: 4px 8px; font-size: 10px; color: #444; border-bottom: 1px solid #eee; }
  .charge-amt { padding: 4px 8px; font-size: 10px; color: #1a1a1a; font-weight: 600; text-align: right; border-bottom: 1px solid #eee; }

  .totals-box { border: 2px solid #1e3a5f; border-radius: 6px; overflow: hidden; }
  .totals-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 12px; border-bottom: 1px solid #d0dce8; }
  .totals-row:last-child { border-bottom: none; }
  .totals-label { font-size: 10px; color: #444; font-weight: 600; }
  .totals-value { font-size: 11px; color: #1a1a1a; font-weight: 700; }
  .totals-grand { background: #1e3a5f; }
  .totals-grand .totals-label { color: #fff; font-size: 11px; font-weight: 700; }
  .totals-grand .totals-value { color: #fff; font-size: 14px; font-weight: 900; }

  /* Status */
  .status-bar { display: flex; gap: 8px; margin-bottom: 8px; }
  .status-pill { flex: 1; border: 1px solid #d0dce8; border-radius: 6px; padding: 5px 8px; text-align: center; }
  .status-pill-label { font-size: 8.5px; color: #666; font-weight: 700; text-transform: uppercase; }
  .status-pill-value { font-size: 11px; font-weight: 700; color: #1e3a5f; margin-top: 2px; }

  /* Remarks */
  .remarks-box { border: 1px solid #d0dce8; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; }
  .remarks-label { font-size: 8.5px; font-weight: 700; color: #666; text-transform: uppercase; margin-bottom: 3px; }
  .remarks-text { font-size: 10px; color: #333; }

  /* Signature */
  .sig-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
  .sig-box { border: 1px solid #d0dce8; border-radius: 6px; padding: 6px 8px; }
  .sig-space { height: 40px; }
  .sig-label { font-size: 8.5px; font-weight: 700; color: #666; text-transform: uppercase; text-align: center; border-top: 1px solid #ccc; padding-top: 4px; margin-top: 4px; }

  /* Footer */
  .footer { margin-top: 8px; border-top: 1px solid #ccc; padding-top: 5px; text-align: center; font-size: 8.5px; color: #888; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { margin: 0; padding: 8mm; }
    @page { size: A4; margin: 0; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <img src="${logoUrl}" class="logo" alt="Logo" />
    <div class="company-info">
      <div class="company-name">${COMPANY.name}</div>
      <div class="company-addr">${COMPANY.address}<br/>${COMPANY.city}</div>
    </div>
    <div class="lr-badge">
      <div class="lr-title">LORRY RECEIPT</div>
      <div class="lr-no-box">${lr.lr_no}</div>
    </div>
  </div>

  <!-- Identity Bar -->
  <div class="identity-bar">
    <div class="id-item"><div class="id-label">LR Date</div><div class="id-value">${fmtDate(lr.lr_date)}</div></div>
    <div class="id-item"><div class="id-label">LR Type</div><div class="id-value">${v(lr.lr_type)}</div></div>
    <div class="id-item"><div class="id-label">Trip No</div><div class="id-value">${v(lr.trip_no)}</div></div>
    <div class="id-item"><div class="id-label">Vehicle No</div><div class="id-value">${v(lr.vehicle_no)}</div></div>
    <div class="id-item"><div class="id-label">Driver</div><div class="id-value">${v(lr.driver_name)}</div></div>
  </div>

  <!-- Party Info -->
  <div class="party-grid">
    <div class="party-box">
      <div class="party-header">Consignor (Sender)</div>
      <div class="party-body">
        <div class="party-name">${lr.consignor_name}</div>
        ${lr.consignor_address ? `<div class="party-detail">${lr.consignor_address}</div>` : ''}
        ${lr.consignor_gstin ? `<div class="party-gstin">GSTIN: ${lr.consignor_gstin}</div>` : ''}
        ${lr.consignor_contact_no ? `<div class="party-detail">Ph: ${lr.consignor_contact_no}</div>` : ''}
      </div>
    </div>
    <div class="party-box">
      <div class="party-header">Consignee (Receiver)</div>
      <div class="party-body">
        <div class="party-name">${lr.consignee_name}</div>
        ${lr.consignee_address ? `<div class="party-detail">${lr.consignee_address}</div>` : ''}
        ${lr.consignee_gstin ? `<div class="party-gstin">GSTIN: ${lr.consignee_gstin}</div>` : ''}
        ${lr.consignee_contact_no ? `<div class="party-detail">Ph: ${lr.consignee_contact_no}</div>` : ''}
      </div>
    </div>
  </div>

  <!-- Route -->
  <div class="route-box">
    <div class="party-header" style="border-radius:5px 5px 0 0;">Route</div>
    <div class="route-inner">
      <div class="route-city">
        <div class="route-city-label">From</div>
        <div class="route-city-name">${lr.from_location_name}</div>
      </div>
      <div class="route-arrow">&#8594;</div>
      <div class="route-city">
        <div class="route-city-label">To</div>
        <div class="route-city-name">${lr.to_location_name}</div>
      </div>
    </div>
  </div>

  <!-- Commodity Table -->
  <table style="margin-bottom:8px;">
    <thead>
      <tr>
        <th>Commodity</th>
        <th>Pkg Type</th>
        <th class="text-center">Packages</th>
        <th class="text-right">Actual Wt (KG)</th>
        <th class="text-right">Charged Wt (KG)</th>
        <th class="text-right">Declared Value</th>
        <th class="text-right">Invoice Value</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${v(lr.commodity_name)}${lr.description_of_goods ? `<br/><span style="font-size:9px;color:#666;">${lr.description_of_goods}</span>` : ''}</td>
        <td>${v(lr.package_type)}</td>
        <td class="text-center">${v(lr.no_of_packages)}</td>
        <td class="text-right">${lr.actual_weight_kg?.toLocaleString('en-IN') || '0'}</td>
        <td class="text-right">${lr.charged_weight_kg?.toLocaleString('en-IN') || '0'}</td>
        <td class="text-right">${fmtAmt(lr.declared_value)}</td>
        <td class="text-right">${fmtAmt(lr.invoice_value)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Reference Docs -->
  <table style="margin-bottom:8px;">
    <thead>
      <tr>
        <th>Invoice No</th>
        <th>Invoice Date</th>
        <th>E-Way Bill No</th>
        <th>EWB Valid Upto</th>
        <th>PO No</th>
        <th>Docket Ref</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${v(lr.invoice_no)}</td>
        <td>${fmtDate(lr.invoice_date)}</td>
        <td style="font-family:monospace;">${v(lr.ewaybill_no)}</td>
        <td>${fmtDate(lr.ewaybill_valid_upto)}</td>
        <td>${v(lr.po_no)}</td>
        <td>${v(lr.docket_ref_no)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Charges + Totals -->
  <div class="charges-grid">
    <div class="charges-table">
      <div class="charges-header">Charge Breakup</div>
      <table style="margin:0;">
        <tbody>
          ${chargeRows || '<tr><td class="charge-label">Freight</td><td class="charge-amt">—</td></tr>'}
        </tbody>
      </table>
    </div>
    <div class="totals-box">
      ${lr.cgst_amount > 0 ? `<div class="totals-row"><span class="totals-label">CGST</span><span class="totals-value">${fmtAmt(lr.cgst_amount)}</span></div>` : ''}
      ${lr.sgst_amount > 0 ? `<div class="totals-row"><span class="totals-label">SGST</span><span class="totals-value">${fmtAmt(lr.sgst_amount)}</span></div>` : ''}
      ${lr.igst_amount > 0 ? `<div class="totals-row"><span class="totals-label">IGST</span><span class="totals-value">${fmtAmt(lr.igst_amount)}</span></div>` : ''}
      <div class="totals-row"><span class="totals-label">Taxable Amount</span><span class="totals-value">${fmtAmt(lr.taxable_amount)}</span></div>
      <div class="totals-row totals-grand"><span class="totals-label">TOTAL AMOUNT</span><span class="totals-value">${fmtAmt(lr.total_amount)}</span></div>
    </div>
  </div>

  <!-- Status & Payment -->
  <div class="status-bar">
    <div class="status-pill">
      <div class="status-pill-label">Payment Basis</div>
      <div class="status-pill-value">${(lr.payment_basis || '—').replace(/_/g, ' ')}</div>
    </div>
    <div class="status-pill">
      <div class="status-pill-label">Movement Type</div>
      <div class="status-pill-value">${v(lr.movement_type)}</div>
    </div>
    <div class="status-pill">
      <div class="status-pill-label">LR Status</div>
      <div class="status-pill-value">${lr.lr_status}</div>
    </div>
    <div class="status-pill">
      <div class="status-pill-label">Billing Status</div>
      <div class="status-pill-value">${lr.billing_status}</div>
    </div>
    <div class="status-pill">
      <div class="status-pill-label">POD Status</div>
      <div class="status-pill-value">${lr.pod_status}</div>
    </div>
  </div>

  ${
    lr.remarks
      ? `<div class="remarks-box"><div class="remarks-label">Remarks</div><div class="remarks-text">${lr.remarks}</div></div>`
      : ''
  }

  <!-- Signatures -->
  <div class="sig-row">
    <div class="sig-box"><div class="sig-space"></div><div class="sig-label">Consignor Signature</div></div>
    <div class="sig-box"><div class="sig-space"></div><div class="sig-label">Driver Signature</div></div>
    <div class="sig-box"><div class="sig-space"></div><div class="sig-label">Authorised Signatory &amp; Stamp</div></div>
  </div>

  <div class="footer">
    This is a computer-generated document. &nbsp;|&nbsp; ${COMPANY.name} &nbsp;|&nbsp; ${COMPANY.address} ${COMPANY.city}
  </div>
</div>
<script>
  window.onload = function() {
    ${downloadPDF ? "document.title = 'LR_" + lr.lr_no + '.pdf' + "';" : ''}
    setTimeout(function() { window.print(); }, 600);
  };
</script>
</body>
</html>`);
    win.document.close();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white bg-opacity-15 rounded-lg flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Print Lorry Receipt</h2>
              {lr && <p className="text-slate-300 text-xs">LR No: {lr.lr_no}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lr && (
              <>
                <button
                  onClick={() => handlePrint(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-15 hover:bg-opacity-25 text-white rounded-lg text-sm font-medium transition-all border border-white border-opacity-20"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => handlePrint(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <FileDown className="w-4 h-4" />
                  Download PDF
                </button>
              </>
            )}
            <button onClick={onClose} className="ml-2 text-slate-300 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Body */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading LR data...</span>
            </div>
          ) : !lr ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Failed to load LR data.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mx-auto" style={{ maxWidth: 820 }}>

              {/* Preview Header */}
              <div className="flex items-center border-b-2 border-slate-800 p-5 gap-4">
                <img src={COMPANY.logo} alt="Logo" className="w-16 h-16 object-contain flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-base font-black text-slate-800 leading-tight">{COMPANY.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{COMPANY.address}</p>
                  <p className="text-xs text-gray-500">{COMPANY.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-slate-800 tracking-widest">LORRY RECEIPT</p>
                  <div className="mt-1 inline-block bg-slate-800 text-white px-3 py-1 rounded text-sm font-bold tracking-wider font-mono">
                    {lr.lr_no}
                  </div>
                </div>
              </div>

              {/* Identity Bar */}
              <div className="grid grid-cols-5 gap-px bg-gray-200 border-b border-gray-200">
                {[
                  ['LR Date', fmtDate(lr.lr_date)],
                  ['LR Type', v(lr.lr_type)],
                  ['Trip No', v(lr.trip_no)],
                  ['Vehicle No', v(lr.vehicle_no)],
                  ['Driver', v(lr.driver_name)],
                ].map(([label, val]) => (
                  <div key={label} className="bg-slate-50 px-3 py-2.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{val}</p>
                  </div>
                ))}
              </div>

              <div className="p-5 space-y-4">

                {/* Consignor / Consignee */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: 'Consignor (Sender)', name: lr.consignor_name, addr: lr.consignor_address, gstin: lr.consignor_gstin, ph: lr.consignor_contact_no },
                    { title: 'Consignee (Receiver)', name: lr.consignee_name, addr: lr.consignee_address, gstin: lr.consignee_gstin, ph: lr.consignee_contact_no },
                  ].map((p) => (
                    <div key={p.title} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-700 px-3 py-1.5">
                        <p className="text-[9px] font-bold text-white uppercase tracking-wide">{p.title}</p>
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-sm text-gray-900">{p.name}</p>
                        {p.addr && <p className="text-xs text-gray-500 mt-1">{p.addr}</p>}
                        {p.gstin && <p className="text-[10px] font-mono text-gray-600 mt-1">GSTIN: {p.gstin}</p>}
                        {p.ph && <p className="text-xs text-gray-500 mt-0.5">Ph: {p.ph}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Route */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-700 px-3 py-1.5">
                    <p className="text-[9px] font-bold text-white uppercase tracking-wide">Route</p>
                  </div>
                  <div className="flex items-center justify-center gap-6 py-3 px-4">
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">From</p>
                      <p className="text-base font-black text-slate-800">{lr.from_location_name}</p>
                    </div>
                    <div className="text-2xl font-black text-slate-400">&#8594;</div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">To</p>
                      <p className="text-base font-black text-slate-800">{lr.to_location_name}</p>
                    </div>
                  </div>
                </div>

                {/* Commodity */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-700 px-3 py-1.5">
                    <p className="text-[9px] font-bold text-white uppercase tracking-wide">Commodity & Shipment</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {['Commodity', 'Pkg Type', 'Packages', 'Actual Wt (KG)', 'Charged Wt (KG)', 'Declared Value', 'Invoice Value'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-3 py-2 font-medium text-gray-800">
                            {v(lr.commodity_name)}
                            {lr.description_of_goods && <p className="text-[10px] text-gray-400">{lr.description_of_goods}</p>}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{v(lr.package_type)}</td>
                          <td className="px-3 py-2 text-gray-600 text-center">{lr.no_of_packages || 0}</td>
                          <td className="px-3 py-2 text-gray-600 text-right">{lr.actual_weight_kg?.toLocaleString('en-IN') || 0}</td>
                          <td className="px-3 py-2 text-gray-600 text-right">{lr.charged_weight_kg?.toLocaleString('en-IN') || 0}</td>
                          <td className="px-3 py-2 text-gray-700 font-medium text-right">{fmtAmt(lr.declared_value)}</td>
                          <td className="px-3 py-2 text-gray-700 font-medium text-right">{fmtAmt(lr.invoice_value)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Reference Docs */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-700 px-3 py-1.5">
                    <p className="text-[9px] font-bold text-white uppercase tracking-wide">Reference Documents</p>
                  </div>
                  <div className="grid grid-cols-3 gap-px bg-gray-200">
                    {[
                      ['Invoice No', v(lr.invoice_no)],
                      ['Invoice Date', fmtDate(lr.invoice_date)],
                      ['E-Way Bill No', v(lr.ewaybill_no)],
                      ['EWB Valid Upto', fmtDate(lr.ewaybill_valid_upto)],
                      ['PO No', v(lr.po_no)],
                      ['Docket Ref', v(lr.docket_ref_no)],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-white px-3 py-2">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                        <p className="text-xs font-medium text-gray-800 mt-0.5 font-mono">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Charges + Totals */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-700 px-3 py-1.5">
                      <p className="text-[9px] font-bold text-white uppercase tracking-wide">Charge Breakup</p>
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {[
                          ['Freight', lr.freight_amount],
                          ['Loading Charges', lr.loading_charges],
                          ['Unloading Charges', lr.unloading_charges],
                          ['Detention Charges', lr.detention_charges],
                          ['Halting Charges', lr.halting_charges],
                          ['ODA Charges', lr.oda_charges],
                          ['Fuel Surcharge', lr.fuel_surcharge],
                          ['Misc. Charges', lr.misc_charges],
                          ['Discount', lr.discount_amount],
                        ]
                          .filter(([, amt]) => (amt as number) > 0)
                          .map(([label, amt]) => (
                            <tr key={label as string} className="border-b border-gray-100 last:border-0">
                              <td className="px-3 py-1.5 text-gray-600">{label as string}</td>
                              <td className="px-3 py-1.5 text-right font-semibold text-gray-800">{fmtAmt(amt as number)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-2 border-slate-800 rounded-lg overflow-hidden">
                    {lr.cgst_amount > 0 && (
                      <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                        <span className="text-xs text-gray-500 font-medium">CGST</span>
                        <span className="text-xs font-semibold text-gray-800">{fmtAmt(lr.cgst_amount)}</span>
                      </div>
                    )}
                    {lr.sgst_amount > 0 && (
                      <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                        <span className="text-xs text-gray-500 font-medium">SGST</span>
                        <span className="text-xs font-semibold text-gray-800">{fmtAmt(lr.sgst_amount)}</span>
                      </div>
                    )}
                    {lr.igst_amount > 0 && (
                      <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                        <span className="text-xs text-gray-500 font-medium">IGST</span>
                        <span className="text-xs font-semibold text-gray-800">{fmtAmt(lr.igst_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                      <span className="text-xs text-gray-500 font-semibold">Taxable Amount</span>
                      <span className="text-sm font-bold text-gray-800">{fmtAmt(lr.taxable_amount)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3 bg-slate-800">
                      <span className="text-sm font-bold text-white">TOTAL AMOUNT</span>
                      <span className="text-lg font-black text-white">{fmtAmt(lr.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="grid grid-cols-5 gap-3">
                  {[
                    ['Payment Basis', (lr.payment_basis || '—').replace(/_/g, ' ')],
                    ['Movement Type', v(lr.movement_type)],
                    ['LR Status', lr.lr_status],
                    ['Billing Status', lr.billing_status],
                    ['POD Status', lr.pod_status],
                  ].map(([label, val]) => (
                    <div key={label} className="border border-gray-200 rounded-lg px-3 py-2 text-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Remarks */}
                {lr.remarks && (
                  <div className="border border-gray-200 rounded-lg px-4 py-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Remarks</p>
                    <p className="text-xs text-gray-700">{lr.remarks}</p>
                  </div>
                )}

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {['Consignor Signature', 'Driver Signature', 'Authorised Signatory & Stamp'].map((label) => (
                    <div key={label} className="border border-gray-200 rounded-lg p-3">
                      <div className="h-12" />
                      <div className="border-t border-gray-300 pt-2 text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-5 py-2.5 text-center">
                <p className="text-[9px] text-gray-400">
                  This is a computer-generated document. &nbsp;|&nbsp; {COMPANY.name} &nbsp;|&nbsp; {COMPANY.address} {COMPANY.city}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-3 flex justify-between items-center bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-500">Click Print or Download PDF to generate the document</p>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
