import { X } from 'lucide-react';

interface CustomerViewModalProps {
  customer: any;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value || <span className="text-gray-400 italic">—</span>}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-5">
      <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">{title}</h5>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

export function CustomerViewModal({ customer, onClose }: CustomerViewModalProps) {
  const divisionDisplay = customer.division
    ? customer.division.split(',').filter(Boolean).join(', ')
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{customer.customer_name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">Customer ID: {customer.customer_id}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                customer.is_active === false
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {customer.is_active === false ? 'Inactive' : 'Active'}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Customer Name" value={customer.customer_name} />
            <Field label="Division" value={divisionDisplay} />
            <Field label="Classification" value={customer.customer_classification} />
            <Field label="Billing Type" value={customer.pay_basis} />
            <Field label="GST Applicable" value={customer.gst_applicable ? 'Yes' : 'No'} />
            {customer.gst_applicable && <Field label="GST Number" value={customer.gst_number} />}
          </div>

          {/* Sales */}
          <Section title="Sales">
            <Field
              label="Sales Person"
              value={
                customer.sales_person
                  ? `${customer.sales_person.employee_code} - ${customer.sales_person.full_name}`
                  : null
              }
            />
            <Field label="Sales Person Email" value={customer.sales_person_email} />
          </Section>

          {/* Contact Information */}
          <Section title="Contact Information">
            <Field label="Contact Person" value={customer.contact_person} />
            <Field label="Contact Person DOD" value={customer.contact_person_dod} />
            <Field label="Contact Mobile" value={customer.contact_mobile} />
            <Field label="Email" value={customer.email} />
          </Section>

          {/* Account Person */}
          <Section title="Account Person">
            <Field label="Account Person" value={customer.account_person} />
            <Field label="Account Person Email" value={customer.account_person_email} />
            <Field label="Account Person Contact" value={customer.account_person_contact} />
          </Section>

          {/* Registered Office */}
          <Section title="Registered Office Address">
            <div className="col-span-2 md:col-span-3">
              <Field label="Address" value={customer.registered_office_address} />
            </div>
            <Field label="City" value={customer.registered_office_city} />
            <Field label="State" value={customer.registered_office_state} />
          </Section>

          {/* Billing Address */}
          <Section title="Billing Address">
            <div className="col-span-2 md:col-span-3">
              <Field label="Address" value={customer.communication_address} />
            </div>
            <Field label="City" value={customer.communication_city} />
            <Field label="State" value={customer.communication_state} />
          </Section>

          {/* Billing & Payment */}
          <Section title="Billing & Payment Settings">
            <Field label="Credit Days" value={customer.credit_days ? String(customer.credit_days) : null} />
            <Field label="POD Type" value={customer.pod_type} />
            <Field label="Invoice Type" value={customer.invoice_type} />
            <Field label="Payment Basis" value={customer.payment_basis} />
          </Section>

          {/* TBB details if applicable */}
          {customer.pay_basis === 'TBB' && (
            <Section title="TBB Details">
              <Field label="Billing Cycle" value={customer.billing_cycle} />
              <Field label="Billing Instance" value={customer.billing_instance} />
              <Field label="Auto Billing" value={customer.auto_billing ? 'Yes' : 'No'} />
            </Section>
          )}

          {/* Instructions & Remarks */}
          {(customer.special_instruction || customer.remarks) && (
            <div className="border-t pt-5 space-y-3">
              {customer.special_instruction && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Special Instruction</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap bg-amber-50 border border-amber-100 rounded-lg p-3">
                    {customer.special_instruction}
                  </p>
                </div>
              )}
              {customer.remarks && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Remarks</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                    {customer.remarks}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
