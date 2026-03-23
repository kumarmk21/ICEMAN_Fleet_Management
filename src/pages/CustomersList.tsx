import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, X, Eye, Power, Upload, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CityAutocomplete } from '../components/CityAutocomplete';
import { CustomerViewModal } from '../components/customers/CustomerViewModal';
import { CustomerUploadModal } from '../components/customers/CustomerUploadModal';

const DIVISION_OPTIONS = ['Iceman(Cold)', 'Equinox(Dry)'];
const CREDIT_DAYS_OPTIONS = [1, 5, 7, 15, 30, 45, 60, 90];

interface CustomerForm {
  customer_name: string;
  division: string[];
  customer_classification: string;
  pay_basis: string;
  gst_applicable: string;
  sales_person_id: string;
  sales_person_email: string;
  gst_number: string;
  contact_person: string;
  contact_person_dod: string;
  contact_mobile: string;
  email: string;
  account_person: string;
  account_person_email: string;
  account_person_contact: string;
  registered_office_address: string;
  registered_office_city: string;
  registered_office_state: string;
  communication_address: string;
  communication_city: string;
  communication_state: string;
  credit_days: number | '';
  pod_type: string;
  invoice_type: string;
  payment_basis: string;
  billing_cycle: string;
  billing_instance: string;
  auto_billing: string;
  special_instruction: string;
  remarks: string;
}

const defaultForm: CustomerForm = {
  customer_name: '',
  division: [],
  customer_classification: '',
  pay_basis: '',
  gst_applicable: '',
  sales_person_id: '',
  sales_person_email: '',
  gst_number: '',
  contact_person: '',
  contact_person_dod: '',
  contact_mobile: '',
  email: '',
  account_person: '',
  account_person_email: '',
  account_person_contact: '',
  registered_office_address: '',
  registered_office_city: '',
  registered_office_state: '',
  communication_address: '',
  communication_city: '',
  communication_state: '',
  credit_days: '',
  pod_type: '',
  invoice_type: '',
  payment_basis: '',
  billing_cycle: '',
  billing_instance: '',
  auto_billing: '',
  special_instruction: '',
  remarks: '',
};

export function CustomersList() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [sameAsRegistered, setSameAsRegistered] = useState(false);
  const [formData, setFormData] = useState<CustomerForm>(defaultForm);
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadSalesPersons();
    loadStates();
  }, []);

  async function loadCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`*, sales_person:user_profiles(user_id, full_name, employee_code)`)
        .order('customer_name');
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSalesPersons() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, employee_code')
        .ilike('status', 'active')
        .order('full_name');
      if (error) throw error;
      setSalesPersons(data || []);
    } catch (error) {
      console.error('Error loading sales persons:', error);
    }
  }

  async function loadStates() {
    try {
      const { data, error } = await supabase
        .from('states_master')
        .select('state_name')
        .order('state_name');
      if (error) throw error;
      setStates(data || []);
    } catch (error) {
      console.error('Error loading states:', error);
    }
  }

  function toggleDivision(option: string) {
    setFormData(prev => {
      const current = prev.division;
      const updated = current.includes(option)
        ? current.filter(d => d !== option)
        : [...current, option];
      return { ...prev, division: updated };
    });
  }

  function validateForm(): string | null {
    if (!formData.customer_name.trim()) return 'Customer Name is required';
    if (!formData.customer_classification) return 'Customer Classification is required';
    if (!formData.pay_basis) return 'Billing Type is required';
    if (!formData.gst_applicable) return 'GST Applicable is required';
    if (formData.gst_applicable === 'Yes' && !formData.gst_number.trim())
      return 'GST Number is required when GST is applicable';
    if (!formData.contact_person.trim()) return 'Contact Person is required';
    if (!formData.contact_mobile.trim()) return 'Contact Mobile is required';
    const mobileNumbers = formData.contact_mobile.split(',').map(m => m.trim());
    for (const mobile of mobileNumbers) {
      if (!/^\d{10}$/.test(mobile))
        return `Invalid mobile number: ${mobile}. Each must be exactly 10 digits`;
    }
    if (!formData.email.trim()) return 'Email is required';
    const emails = formData.email.split(',').map(e => e.trim());
    for (const email of emails) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return `Invalid email address: ${email}`;
    }
    if (!formData.registered_office_address.trim()) return 'Registered Office Address is required';
    if (!formData.communication_address.trim()) return 'Billing Address is required';
    if (formData.pay_basis === 'TBB') {
      if (!formData.billing_cycle) return 'Billing Cycle is required for TBB';
      if (!formData.billing_instance) return 'Billing Instance is required for TBB';
      if (!formData.auto_billing) return 'Auto Billing is required for TBB';
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { alert(validationError); return; }
    setSaving(true);
    try {
      const submitData: any = {
        customer_name: formData.customer_name,
        division: formData.division.join(','),
        customer_classification: formData.customer_classification,
        pay_basis: formData.pay_basis,
        gst_applicable: formData.gst_applicable === 'Yes',
        sales_person_id: formData.sales_person_id || null,
        sales_person_email: formData.sales_person_email || null,
        gst_number: formData.gst_number || null,
        contact_person: formData.contact_person,
        contact_person_dod: formData.contact_person_dod || null,
        contact_mobile: formData.contact_mobile,
        email: formData.email,
        account_person: formData.account_person || null,
        account_person_email: formData.account_person_email || null,
        account_person_contact: formData.account_person_contact || null,
        registered_office_address: formData.registered_office_address,
        registered_office_city: formData.registered_office_city || null,
        registered_office_state: formData.registered_office_state || null,
        communication_address: formData.communication_address,
        communication_city: formData.communication_city || null,
        communication_state: formData.communication_state || null,
        credit_days: formData.credit_days !== '' ? Number(formData.credit_days) : null,
        pod_type: formData.pod_type || null,
        invoice_type: formData.invoice_type || null,
        payment_basis: formData.payment_basis || null,
        special_instruction: formData.special_instruction || null,
        remarks: formData.remarks || null,
      };

      if (formData.pay_basis === 'TBB') {
        submitData.billing_cycle = formData.billing_cycle;
        submitData.billing_instance = formData.billing_instance;
        submitData.auto_billing = formData.auto_billing === 'Yes';
      } else {
        submitData.billing_cycle = null;
        submitData.billing_instance = null;
        submitData.auto_billing = null;
      }

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(submitData)
          .eq('customer_id', editingCustomer.customer_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('customers').insert([submitData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingCustomer(null);
      setFormData(defaultForm);
      loadCustomers();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      alert(error.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      const { error } = await supabase.from('customers').delete().eq('customer_id', id);
      if (error) throw error;
      loadCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      alert(error.message || 'Failed to delete customer');
    }
  }

  async function handleToggleActive(customer: any) {
    const newState = !customer.is_active;
    const action = newState ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} "${customer.customer_name}"?`)) return;
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: newState })
        .eq('customer_id', customer.customer_id);
      if (error) throw error;
      loadCustomers();
    } catch (error: any) {
      console.error('Error updating customer status:', error);
      alert(error.message || 'Failed to update customer status');
    }
  }

  function openEditModal(customer: any) {
    setEditingCustomer(customer);
    const divisionRaw = customer.division || '';
    const divisionArr = divisionRaw
      ? divisionRaw.split(',').map((d: string) => d.trim()).filter(Boolean)
      : [];
    setFormData({
      customer_name: customer.customer_name || '',
      division: divisionArr,
      customer_classification: customer.customer_classification || '',
      pay_basis: customer.pay_basis || '',
      gst_applicable: customer.gst_applicable ? 'Yes' : 'No',
      sales_person_id: customer.sales_person_id || '',
      sales_person_email: customer.sales_person_email || '',
      gst_number: customer.gst_number || '',
      contact_person: customer.contact_person || '',
      contact_person_dod: customer.contact_person_dod || '',
      contact_mobile: customer.contact_mobile || '',
      email: customer.email || '',
      account_person: customer.account_person || '',
      account_person_email: customer.account_person_email || '',
      account_person_contact: customer.account_person_contact || '',
      registered_office_address: customer.registered_office_address || customer.billing_address || '',
      registered_office_city: customer.registered_office_city || '',
      registered_office_state: customer.registered_office_state || '',
      communication_address: customer.communication_address || '',
      communication_city: customer.communication_city || '',
      communication_state: customer.communication_state || '',
      credit_days: customer.credit_days || '',
      pod_type: customer.pod_type || '',
      invoice_type: customer.invoice_type || '',
      payment_basis: customer.payment_basis || '',
      billing_cycle: customer.billing_cycle || '',
      billing_instance: customer.billing_instance || '',
      auto_billing: customer.auto_billing ? 'Yes' : 'No',
      special_instruction: customer.special_instruction || '',
      remarks: customer.remarks || '',
    });
    setSameAsRegistered(false);
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingCustomer(null);
    setFormData(defaultForm);
    setSameAsRegistered(false);
    setShowModal(true);
  }

  function handleDownloadTemplate() {
    const headers = [
      'customer_name','division','customer_classification','pay_basis','gst_applicable','gst_number',
      'contact_person','contact_person_dod','contact_mobile','email',
      'account_person','account_person_email','account_person_contact',
      'registered_office_address','registered_office_city','registered_office_state',
      'billing_address','billing_city','billing_state',
      'credit_days','pod_type','invoice_type','payment_basis',
      'sales_person_email','special_instruction','remarks',
    ];
    const sample = [
      'ABC Logistics Pvt Ltd','Iceman(Cold)','Corporate','Paid','Yes','22AAAAA0000A1Z5',
      'Rajesh Kumar','1985-06-15','9876543210','rajesh@abc.com',
      'Priya Sharma','priya@abc.com','9876500000',
      '123 MG Road Andheri East','Mumbai','Maharashtra',
      '123 MG Road Andheri East','Mumbai','Maharashtra',
      '30','Physical','Email','Bill Payment',
      'sales@abc.com','Handle with care','Key account',
    ];
    const csvContent = [headers.join(','), sample.map(v => `"${v}"`).join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'Customer_Master_Template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleSameAsRegistered(checked: boolean) {
    setSameAsRegistered(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        communication_address: prev.registered_office_address,
        communication_city: prev.registered_office_city,
        communication_state: prev.registered_office_state,
      }));
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-xl font-bold">Customers</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => setShowInactive(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border ${
                showInactive
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Power className="w-4 h-4" />
              {showInactive ? 'Showing Inactive' : 'Show Inactive'}
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Division</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classification</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center">Loading...</td></tr>
            ) : customers.filter(c => showInactive ? c.is_active === false : c.is_active !== false).length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                {showInactive ? 'No inactive customers' : 'No customers found'}
              </td></tr>
            ) : (
              customers
                .filter(c => showInactive ? c.is_active === false : c.is_active !== false)
                .map((customer) => (
                <tr key={customer.customer_id} className={`hover:bg-gray-50 ${customer.is_active === false ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 font-medium">{customer.customer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.division || '—'}</td>
                  <td className="px-6 py-4">{customer.customer_classification}</td>
                  <td className="px-6 py-4">{customer.pay_basis}</td>
                  <td className="px-6 py-4">{customer.contact_person}</td>
                  <td className="px-6 py-4">{customer.contact_mobile}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      customer.is_active === false
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {customer.is_active === false ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setViewingCustomer(customer)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg mr-1 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(customer)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg mr-1 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(customer)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg mr-1 transition-colors ${
                        customer.is_active === false
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-amber-600 hover:bg-amber-50'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      {customer.is_active === false ? 'Activate' : 'Deactivate'}
                    </button>
                    <button
                      onClick={() => handleDelete(customer.customer_id)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => { setShowModal(false); setEditingCustomer(null); setFormData(defaultForm); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {editingCustomer && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className={labelCls}>Customer ID</label>
                  <input
                    type="text"
                    value={editingCustomer.customer_id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelCls}>
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                  <div className="flex gap-6">
                    {DIVISION_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.division.includes(opt)}
                          onChange={() => toggleDivision(opt)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Classification <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {['Corporate', 'Broker'].map((val) => (
                      <label key={val} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="customer_classification"
                          value={val}
                          checked={formData.customer_classification === val}
                          onChange={(e) => setFormData({ ...formData, customer_classification: e.target.value })}
                          required
                        />
                        {val}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {['Paid', 'To Pay', 'TBB', 'ATH/BTH'].map((val) => (
                      <label key={val} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pay_basis"
                          value={val}
                          checked={formData.pay_basis === val}
                          onChange={(e) => setFormData({ ...formData, pay_basis: e.target.value })}
                          required
                        />
                        {val}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Applicable <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {['Yes', 'No'].map((val) => (
                      <label key={val} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gst_applicable"
                          value={val}
                          checked={formData.gst_applicable === val}
                          onChange={(e) => setFormData({
                            ...formData,
                            gst_applicable: e.target.value,
                            ...(e.target.value === 'No' ? { gst_number: '' } : {}),
                          })}
                          required
                        />
                        {val}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Sales Person</label>
                  <select
                    value={formData.sales_person_id}
                    onChange={(e) => setFormData({ ...formData, sales_person_id: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Select Sales Person</option>
                    {salesPersons.map((sp) => (
                      <option key={sp.user_id} value={sp.user_id}>
                        {sp.employee_code} - {sp.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Sales Person Email</label>
                  <input
                    type="email"
                    value={formData.sales_person_email}
                    onChange={(e) => setFormData({ ...formData, sales_person_email: e.target.value })}
                    className={inputCls}
                    placeholder="salesperson@example.com"
                  />
                </div>

                {formData.gst_applicable === 'Yes' && (
                  <div>
                    <label className={labelCls}>
                      GST Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                      className={inputCls}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                    />
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="border-t pt-6">
                <h4 className="text-base font-semibold text-gray-800 mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contact_person}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData({ ...formData, contact_person: v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() });
                      }}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Contact Person DOD</label>
                    <input
                      type="date"
                      value={formData.contact_person_dod}
                      onChange={(e) => setFormData({ ...formData, contact_person_dod: e.target.value })}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      Contact Mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contact_mobile}
                      onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                      className={inputCls}
                      placeholder="9876543210 or 9876543210, 9876543211"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple numbers with commas</p>
                  </div>

                  <div>
                    <label className={labelCls}>
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputCls}
                      placeholder="email@example.com or email1@, email2@"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
                  </div>
                </div>
              </div>

              {/* Account Person */}
              <div className="border-t pt-6">
                <h4 className="text-base font-semibold text-gray-800 mb-4">Account Person</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Account Person</label>
                    <input
                      type="text"
                      value={formData.account_person}
                      onChange={(e) => setFormData({ ...formData, account_person: e.target.value })}
                      className={inputCls}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Account Person Email</label>
                    <input
                      type="email"
                      value={formData.account_person_email}
                      onChange={(e) => setFormData({ ...formData, account_person_email: e.target.value })}
                      className={inputCls}
                      placeholder="account@example.com"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Account Person Contact Number</label>
                    <input
                      type="text"
                      value={formData.account_person_contact}
                      onChange={(e) => setFormData({ ...formData, account_person_contact: e.target.value })}
                      className={inputCls}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>
              </div>

              {/* Registered Office Address */}
              <div className="border-t pt-6">
                <h4 className="text-base font-semibold text-gray-800 mb-4">Registered Office Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelCls}>
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.registered_office_address}
                      onChange={(e) => setFormData({ ...formData, registered_office_address: e.target.value })}
                      rows={2}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <CityAutocomplete
                      value={formData.registered_office_city}
                      onChange={(value) => setFormData({ ...formData, registered_office_city: value })}
                      onStateChange={(state) => setFormData({ ...formData, registered_office_state: state })}
                      placeholder="Search or enter city..."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <input
                      type="text"
                      value={formData.registered_office_state}
                      onChange={(e) => setFormData({ ...formData, registered_office_state: e.target.value })}
                      className={inputCls}
                      list="states-list"
                      placeholder="Search or enter state..."
                    />
                    <datalist id="states-list">
                      {states.map((s) => <option key={s.state_name} value={s.state_name} />)}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-gray-800">Billing Address</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsRegistered}
                      onChange={(e) => handleSameAsRegistered(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Same as Registered Office Address</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelCls}>
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.communication_address}
                      onChange={(e) => setFormData({ ...formData, communication_address: e.target.value })}
                      rows={2}
                      disabled={sameAsRegistered}
                      className={`${inputCls} disabled:bg-gray-100`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <CityAutocomplete
                      value={formData.communication_city}
                      onChange={(value) => setFormData({ ...formData, communication_city: value })}
                      onStateChange={(state) => setFormData({ ...formData, communication_state: state })}
                      disabled={sameAsRegistered}
                      placeholder="Search or enter city..."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <input
                      type="text"
                      value={formData.communication_state}
                      onChange={(e) => setFormData({ ...formData, communication_state: e.target.value })}
                      disabled={sameAsRegistered}
                      className={`${inputCls} disabled:bg-gray-100`}
                      list="states-list"
                      placeholder="Search or enter state..."
                    />
                  </div>
                </div>
              </div>

              {/* Billing & Payment Settings */}
              <div className="border-t pt-6">
                <h4 className="text-base font-semibold text-gray-800 mb-4">Billing & Payment Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelCls}>Credit Days</label>
                    <select
                      value={formData.credit_days}
                      onChange={(e) => setFormData({ ...formData, credit_days: e.target.value === '' ? '' : Number(e.target.value) })}
                      className={inputCls}
                    >
                      <option value="">Select Credit Days</option>
                      {CREDIT_DAYS_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">POD Type</label>
                    <div className="flex gap-4">
                      {['Physical', 'Scanned'].map((val) => (
                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pod_type"
                            value={val}
                            checked={formData.pod_type === val}
                            onChange={(e) => setFormData({ ...formData, pod_type: e.target.value })}
                          />
                          {val}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Type</label>
                    <div className="flex gap-4">
                      {['Email', 'Physical'].map((val) => (
                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="invoice_type"
                            value={val}
                            checked={formData.invoice_type === val}
                            onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value })}
                          />
                          {val}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Basis</label>
                    <div className="flex gap-4">
                      {['Advance Payment', 'Bill Payment'].map((val) => (
                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="payment_basis"
                            value={val}
                            checked={formData.payment_basis === val}
                            onChange={(e) => setFormData({ ...formData, payment_basis: e.target.value })}
                          />
                          {val}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* TBB Details */}
              {formData.pay_basis === 'TBB' && (
                <div className="border-t pt-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-base font-semibold text-gray-800 mb-4">TBB Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Billing Cycle <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Daily', 'Weekly', 'Fortnightly', 'Monthly'].map((cycle) => (
                            <label key={cycle} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="billing_cycle"
                                value={cycle}
                                checked={formData.billing_cycle === cycle}
                                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                                required
                              />
                              {cycle}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Billing Instance <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-col gap-2">
                          {['Booked', 'Delivered', 'POD Recd'].map((instance) => (
                            <label key={instance} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="billing_instance"
                                value={instance}
                                checked={formData.billing_instance === instance}
                                onChange={(e) => setFormData({ ...formData, billing_instance: e.target.value })}
                                required
                              />
                              {instance}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auto Billing <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4">
                          {['Yes', 'No'].map((val) => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="auto_billing"
                                value={val}
                                checked={formData.auto_billing === val}
                                onChange={(e) => setFormData({ ...formData, auto_billing: e.target.value })}
                                required
                              />
                              {val}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Instruction & Remarks */}
              <div className="border-t pt-6 space-y-4">
                <div>
                  <label className={labelCls}>Special Instruction</label>
                  <textarea
                    value={formData.special_instruction}
                    onChange={(e) => setFormData({ ...formData, special_instruction: e.target.value })}
                    rows={3}
                    className={inputCls}
                    placeholder="Any special instructions for this customer..."
                  />
                </div>
                <div>
                  <label className={labelCls}>Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={2}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingCustomer(null); setFormData(defaultForm); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingCustomer && (
        <CustomerViewModal
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
        />
      )}

      {showUploadModal && (
        <CustomerUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => { setShowUploadModal(false); loadCustomers(); }}
        />
      )}
    </div>
  );
}
