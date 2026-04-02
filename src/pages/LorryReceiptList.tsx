import { useEffect, useState } from 'react';
import {
  Search, Download, ScrollText, Eye, Calendar,
  RefreshCw, ChevronRight, Printer,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { downloadCSV } from '../lib/csv-utils';
import { LRPrintModal } from '../components/lorry-receipts/LRPrintModal';

interface LR {
  lr_id: string;
  lr_no: string;
  lr_date: string | null;
  lr_type: string | null;
  customer_name: string;
  billing_party_name: string | null;
  consignor_name: string;
  consignee_name: string;
  from_location_name: string;
  to_location_name: string;
  trip_no: string | null;
  vehicle_no: string | null;
  driver_name: string | null;
  payment_basis: string | null;
  freight_amount: number;
  taxable_amount: number;
  total_amount: number;
  lr_status: string;
  billing_status: string;
  pod_status: string;
  created_on: string | null;
  movement_type: string | null;
  no_of_packages: number;
  actual_weight_kg: number;
  charged_weight_kg: number;
  ewaybill_no: string | null;
  invoice_no: string | null;
  remarks: string | null;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-700',
  BILLED: 'bg-green-100 text-green-700',
  RECEIVED: 'bg-green-100 text-green-700',
  WAIVED: 'bg-gray-100 text-gray-600',
};

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[value] || 'bg-gray-100 text-gray-600'}`}>
      {value}
    </span>
  );
}

export function LorryReceiptList() {
  const [records, setRecords] = useState<LR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState(daysAgo(7));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedLR, setSelectedLR] = useState<LR | null>(null);
  const [printLRId, setPrintLRId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, [fromDate, toDate]);

  async function loadRecords() {
    setLoading(true);
    try {
      const fromISO = new Date(fromDate + 'T00:00:00').toISOString();
      const toISO = new Date(toDate + 'T23:59:59').toISOString();

      const { data, error } = await supabase
        .from('fm_lorry_receipt')
        .select('*')
        .eq('is_deleted', false)
        .gte('lr_date', fromISO)
        .lte('lr_date', toISO)
        .order('lr_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error loading LR records:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const exportData = filtered.map((r) => ({
      'LR No': r.lr_no,
      'LR Date': r.lr_date ? new Date(r.lr_date).toLocaleDateString('en-IN') : '',
      'LR Type': r.lr_type || '',
      'Customer': r.customer_name,
      'Consignor': r.consignor_name,
      'Consignee': r.consignee_name,
      'From': r.from_location_name,
      'To': r.to_location_name,
      'Trip No': r.trip_no || '',
      'Vehicle No': r.vehicle_no || '',
      'Driver': r.driver_name || '',
      'Movement Type': r.movement_type || '',
      'Payment Basis': r.payment_basis || '',
      'Packages': r.no_of_packages,
      'Actual Weight (KG)': r.actual_weight_kg,
      'Charged Weight (KG)': r.charged_weight_kg,
      'E-Way Bill No': r.ewaybill_no || '',
      'Invoice No': r.invoice_no || '',
      'Freight (₹)': r.freight_amount,
      'Taxable Amount (₹)': r.taxable_amount,
      'Total Amount (₹)': r.total_amount,
      'LR Status': r.lr_status,
      'Billing Status': r.billing_status,
      'POD Status': r.pod_status,
      'Remarks': r.remarks || '',
    }));
    downloadCSV(
      exportData,
      `LorryReceipts_${fromDate}_to_${toDate}`,
    );
  }

  const filtered = records.filter((r) => {
    const s = searchTerm.toLowerCase();
    return (
      r.lr_no.toLowerCase().includes(s) ||
      r.customer_name.toLowerCase().includes(s) ||
      r.consignor_name.toLowerCase().includes(s) ||
      r.consignee_name.toLowerCase().includes(s) ||
      r.from_location_name.toLowerCase().includes(s) ||
      r.to_location_name.toLowerCase().includes(s) ||
      (r.trip_no || '').toLowerCase().includes(s) ||
      (r.vehicle_no || '').toLowerCase().includes(s) ||
      (r.driver_name || '').toLowerCase().includes(s)
    );
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-5">

      {/* Filters bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col md:flex-row md:items-end gap-4">

          {/* Date Range */}
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            <div className="pb-2 text-gray-400">
              <ChevronRight className="w-4 h-4" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={loadRecords}
              title="Refresh"
              className="pb-0.5 p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by LR No, Customer, Party, Route, Vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>
        </div>

        {/* Summary row */}
        <div className="mt-4 flex flex-wrap gap-4 pt-3 border-t border-gray-100">
          <Stat label="Total LRs" value={String(filtered.length)} />
          <Stat label="Total Freight" value={fmt(filtered.reduce((s, r) => s + (r.freight_amount || 0), 0))} />
          <Stat label="Total Amount" value={fmt(filtered.reduce((s, r) => s + (r.total_amount || 0), 0))} />
          <Stat label="Pending Billing" value={String(filtered.filter((r) => r.billing_status === 'PENDING').length)} highlight />
          <Stat label="POD Pending" value={String(filtered.filter((r) => r.pod_status === 'PENDING').length)} highlight />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-gray-800">Lorry Receipts</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length} records</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">LR No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">LR Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Consignor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Consignee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Route</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Trip No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Payment</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Freight</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">LR Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Billing</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">POD</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={15} className="px-4 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                      <span>Loading Lorry Receipts...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        <ScrollText className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No Lorry Receipts found</p>
                      <p className="text-gray-400 text-xs">Try adjusting the date range or search term</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.lr_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 font-mono text-xs">{r.lr_no}</span>
                      {r.lr_type && (
                        <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{r.lr_type}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(r.lr_date)}</td>
                    <td className="px-4 py-3 text-gray-800 max-w-[140px] truncate" title={r.customer_name}>{r.customer_name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate" title={r.consignor_name}>{r.consignor_name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate" title={r.consignee_name}>{r.consignee_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-gray-600 text-xs">{r.from_location_name}</span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span className="text-gray-600 text-xs">{r.to_location_name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.vehicle_no || <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3">
                      {r.trip_no
                        ? <span className="font-mono text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{r.trip_no}</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {r.payment_basis
                        ? <span className="text-xs font-medium text-gray-600">{r.payment_basis.replace('_', ' ')}</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{fmt(r.freight_amount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(r.total_amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge value={r.lr_status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge value={r.billing_status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge value={r.pod_status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedLR(r)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPrintLRId(r.lr_id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Print LR"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LR Detail Modal */}
      {selectedLR && (
        <LRDetailModal lr={selectedLR} onClose={() => setSelectedLR(null)} />
      )}

      {/* LR Print Modal */}
      {printLRId && (
        <LRPrintModal lrId={printLRId} onClose={() => setPrintLRId(null)} />
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{label}:</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-amber-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

function LRDetailModal({ lr, onClose }: { lr: LR; onClose: () => void }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-15 rounded-lg flex items-center justify-center">
              <ScrollText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">{lr.lr_no}</h3>
              <p className="text-slate-300 text-xs">Lorry Receipt Details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1">
            <span className="text-lg font-bold">×</span>
          </button>
        </div>

        <div className="p-6 space-y-5">

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Detail label="LR Date" value={fmtDate(lr.lr_date)} />
            <Detail label="LR Type" value={lr.lr_type || '—'} />
            <Detail label="Trip No" value={lr.trip_no || '—'} />
            <Detail label="Vehicle" value={lr.vehicle_no || '—'} />
            <Detail label="Driver" value={lr.driver_name || '—'} />
            <Detail label="Payment Basis" value={lr.payment_basis?.replace('_', ' ') || '—'} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailBlock title="Consignor (Sender)">
              <p className="font-semibold text-gray-800">{lr.consignor_name}</p>
            </DetailBlock>
            <DetailBlock title="Consignee (Receiver)">
              <p className="font-semibold text-gray-800">{lr.consignee_name}</p>
            </DetailBlock>
          </div>

          <DetailBlock title="Route">
            <p className="text-gray-800 font-medium">
              {lr.from_location_name} <span className="text-gray-400 mx-2">→</span> {lr.to_location_name}
            </p>
          </DetailBlock>

          <DetailBlock title="Financials">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Freight</p>
                <p className="font-semibold text-gray-800">{fmt(lr.freight_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Taxable Amount</p>
                <p className="font-semibold text-gray-800">{fmt(lr.taxable_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                <p className="font-bold text-gray-900 text-lg">{fmt(lr.total_amount)}</p>
              </div>
            </div>
          </DetailBlock>

          <div className="grid grid-cols-3 gap-3">
            <DetailBlock title="LR Status">
              <StatusBadge value={lr.lr_status} />
            </DetailBlock>
            <DetailBlock title="Billing Status">
              <StatusBadge value={lr.billing_status} />
            </DetailBlock>
            <DetailBlock title="POD Status">
              <StatusBadge value={lr.pod_status} />
            </DetailBlock>
          </div>

          {lr.remarks && (
            <DetailBlock title="Remarks">
              <p className="text-gray-700 text-sm">{lr.remarks}</p>
            </DetailBlock>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  );
}
