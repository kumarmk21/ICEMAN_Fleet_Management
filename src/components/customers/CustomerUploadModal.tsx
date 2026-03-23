import { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { parseCSV, readFileAsText, downloadCSV } from '../../lib/csv-utils';

const TEMPLATE_HEADERS = [
  'customer_name',
  'division',
  'customer_classification',
  'pay_basis',
  'gst_applicable',
  'gst_number',
  'contact_person',
  'contact_person_dod',
  'contact_mobile',
  'email',
  'account_person',
  'account_person_email',
  'account_person_contact',
  'registered_office_address',
  'registered_office_city',
  'registered_office_state',
  'billing_address',
  'billing_city',
  'billing_state',
  'credit_days',
  'pod_type',
  'invoice_type',
  'payment_basis',
  'sales_person_email',
  'special_instruction',
  'remarks',
];

const SAMPLE_ROW = [
  'ABC Logistics Pvt Ltd',
  'Iceman(Cold)',
  'Corporate',
  'Paid',
  'Yes',
  '22AAAAA0000A1Z5',
  'Rajesh Kumar',
  '1985-06-15',
  '9876543210',
  'rajesh@abclogistics.com',
  'Priya Sharma',
  'priya@abclogistics.com',
  '9876500000',
  '123 MG Road, Andheri East',
  'Mumbai',
  'Maharashtra',
  '123 MG Road, Andheri East',
  'Mumbai',
  'Maharashtra',
  '30',
  'Physical',
  'Email',
  'Bill Payment',
  'sales@abclogistics.com',
  'Handle with care',
  'Key account',
];

function downloadTemplate() {
  const csvRows = [TEMPLATE_HEADERS.join(','), SAMPLE_ROW.map(v => `"${v}"`).join(',')];
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', 'Customer_Master_Template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface ValidationResult {
  row: number;
  errors: string[];
}

function validateRow(row: any, index: number): string[] {
  const errors: string[] = [];
  if (!row.customer_name?.trim()) errors.push('customer_name is required');
  if (!row.customer_classification?.trim()) errors.push('customer_classification is required (Corporate/Broker)');
  else if (!['Corporate', 'Broker'].includes(row.customer_classification.trim()))
    errors.push('customer_classification must be Corporate or Broker');
  if (!row.pay_basis?.trim()) errors.push('pay_basis is required');
  else if (!['Paid', 'To Pay', 'TBB', 'ATH/BTH'].includes(row.pay_basis.trim()))
    errors.push('pay_basis must be Paid, To Pay, TBB, or ATH/BTH');
  if (!row.gst_applicable?.trim()) errors.push('gst_applicable is required (Yes/No)');
  if (!row.contact_person?.trim()) errors.push('contact_person is required');
  if (!row.contact_mobile?.trim()) errors.push('contact_mobile is required');
  if (!row.email?.trim()) errors.push('email is required');
  if (!row.registered_office_address?.trim()) errors.push('registered_office_address is required');
  if (!row.billing_address?.trim()) errors.push('billing_address is required');
  if (row.credit_days?.trim() && !['1', '5', '7', '15', '30', '45', '60', '90'].includes(row.credit_days.trim()))
    errors.push('credit_days must be one of: 1, 5, 7, 15, 30, 45, 60, 90');
  return errors;
}

interface CustomerUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CustomerUploadModal({ onClose, onSuccess }: CustomerUploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null);
  const [fileName, setFileName] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploadResult(null);

    const text = await readFileAsText(file);
    const rows = parseCSV(text);

    const validations: ValidationResult[] = [];
    rows.forEach((row, i) => {
      const errors = validateRow(row, i);
      if (errors.length > 0) validations.push({ row: i + 2, errors });
    });

    setParsedRows(rows);
    setValidationResults(validations);
  }

  async function handleUpload() {
    if (validationResults.length > 0) {
      alert('Please fix validation errors before uploading');
      return;
    }
    if (parsedRows.length === 0) return;

    setUploading(true);
    let success = 0;
    let failed = 0;

    for (const row of parsedRows) {
      try {
        const insertData: any = {
          customer_name: row.customer_name?.trim(),
          division: row.division?.trim() || '',
          customer_classification: row.customer_classification?.trim(),
          pay_basis: row.pay_basis?.trim(),
          gst_applicable: row.gst_applicable?.trim().toLowerCase() === 'yes',
          gst_number: row.gst_number?.trim() || null,
          contact_person: row.contact_person?.trim(),
          contact_person_dod: row.contact_person_dod?.trim() || null,
          contact_mobile: row.contact_mobile?.trim(),
          email: row.email?.trim(),
          account_person: row.account_person?.trim() || null,
          account_person_email: row.account_person_email?.trim() || null,
          account_person_contact: row.account_person_contact?.trim() || null,
          registered_office_address: row.registered_office_address?.trim(),
          registered_office_city: row.registered_office_city?.trim() || null,
          registered_office_state: row.registered_office_state?.trim() || null,
          communication_address: row.billing_address?.trim(),
          communication_city: row.billing_city?.trim() || null,
          communication_state: row.billing_state?.trim() || null,
          credit_days: row.credit_days?.trim() ? Number(row.credit_days.trim()) : null,
          pod_type: row.pod_type?.trim() || null,
          invoice_type: row.invoice_type?.trim() || null,
          payment_basis: row.payment_basis?.trim() || null,
          sales_person_email: row.sales_person_email?.trim() || null,
          special_instruction: row.special_instruction?.trim() || null,
          remarks: row.remarks?.trim() || null,
          is_active: true,
        };

        const { error } = await supabase.from('customers').insert([insertData]);
        if (error) throw error;
        success++;
      } catch {
        failed++;
      }
    }

    setUploadResult({ success, failed });
    setUploading(false);
    if (success > 0) onSuccess();
  }

  const hasErrors = validationResults.length > 0;
  const previewRows = parsedRows.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold">Customer Master Upload</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Step 1 — Download Template</h4>
                <p className="text-sm text-blue-700">
                  Download the CSV template, fill in customer data, and upload it below.
                  The first row is a sample entry — replace it with your data.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-blue-600">
                  <span className="bg-blue-100 px-2 py-0.5 rounded">Required: customer_name, customer_classification, pay_basis, gst_applicable, contact_person, contact_mobile, email, registered_office_address, billing_address</span>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Template
              </button>
            </div>
          </div>

          {/* Step 2: Upload File */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Step 2 — Select CSV File</h4>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              {fileName ? (
                <p className="text-sm font-medium text-gray-700">{fileName}</p>
              ) : (
                <p className="text-sm text-gray-500">Click to select a CSV file</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Only .csv files are supported</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Validation Errors */}
          {validationResults.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <h4 className="font-semibold text-red-800">
                  {validationResults.length} row(s) have validation errors
                </h4>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {validationResults.map((v) => (
                  <div key={v.row} className="text-sm">
                    <span className="font-medium text-red-700">Row {v.row}:</span>{' '}
                    <span className="text-red-600">{v.errors.join('; ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-800">
                Upload complete: <strong>{uploadResult.success}</strong> records inserted
                {uploadResult.failed > 0 && (
                  <>, <strong className="text-red-700">{uploadResult.failed}</strong> failed</>
                )}.
              </p>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && !hasErrors && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Preview ({parsedRows.length} rows{parsedRows.length > 5 ? ', showing first 5' : ''})
              </h4>
              <div className="overflow-x-auto border rounded-lg">
                <table className="text-xs w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['customer_name', 'customer_classification', 'pay_basis', 'contact_person', 'contact_mobile', 'email'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-800">{row.customer_name}</td>
                        <td className="px-3 py-2 text-gray-600">{row.customer_classification}</td>
                        <td className="px-3 py-2 text-gray-600">{row.pay_basis}</td>
                        <td className="px-3 py-2 text-gray-600">{row.contact_person}</td>
                        <td className="px-3 py-2 text-gray-600">{row.contact_mobile}</td>
                        <td className="px-3 py-2 text-gray-600">{row.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={parsedRows.length === 0 || hasErrors || uploading || !!uploadResult}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : `Upload ${parsedRows.length > 0 ? `${parsedRows.length} Records` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
