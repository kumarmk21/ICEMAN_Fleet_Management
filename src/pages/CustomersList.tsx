import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CityAutocomplete } from '../components/CityAutocomplete';

interface CustomerForm {
  customer_name: string;
  customer_classification: string;
  pay_basis: string;
  gst_applicable: string;
  sales_person_id: string;
  gst_number: string;
  contact_person: string;
  contact_mobile: string;
  email: string;
  registered_office_address: string;
  registered_office_city: string;
  registered_office_state: string;
  communication_address: string;
  communication_city: string;
  communication_state: string;
  credit_days: number;
  billing_cycle: string;
  billing_instance: string;
  auto_billing: string;
  remarks: string;
}

export function CustomersList() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [sameAsRegistered, setSameAsRegistered] = useState(false);
  const [formData, setFormData] = useState<CustomerForm>({
    customer_name: '',
    customer_classification: '',
    pay_basis: '',
    gst_applicable: '',
    sales_person_id: '',
    gst_number: '',
    contact_person: '',
    contact_mobile: '',
    email: '',
    registered_office_address: '',
    registered_office_city: '',
    registered_office_state: '',
    communication_address: '',
    communication_city: '',
    communication_state: '',
    credit_days: 0,
    billing_cycle: '',
    billing_instance: '',
    auto_billing: '',
    remarks: '',
  });

  useEffect(() => {
    loadCustomers();
    loadSalesPersons();
    loadStates();
  }, []);

  async function loadCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          sales_person:user_profiles(user_id, full_name, employee_code)
        `)
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
        .eq('status', 'active')
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

  function validateForm(): string | null {
    if (!formData.customer_name.trim()) {
      return 'Customer Name is required';
    }
    if (!formData.customer_classification) {
      return 'Customer Classification is required';
    }
    if (!formData.pay_basis) {
      return 'Pay Basis is required';
    }
    if (!formData.gst_applicable) {
      return 'GST Applicable is required';
    }
    if (formData.gst_applicable === 'Yes' && !formData.gst_number.trim()) {
      return 'GST Number is required when GST Applicable is Yes';
    }
    if (!formData.contact_person.trim()) {
      return 'Contact Person is required';
    }
    if (!formData.contact_mobile.trim()) {
      return 'Contact Mobile is required';
    }
    const mobileNumbers = formData.contact_mobile.split(',').map(m => m.trim());
    for (const mobile of mobileNumbers) {
      if (!/^\d{10}$/.test(mobile)) {
        return `Invalid mobile number: ${mobile}. Each mobile number must be exactly 10 digits`;
      }
    }
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    const emails = formData.email.split(',').map(e => e.trim());
    for (const email of emails) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return `Invalid email address: ${email}`;
      }
    }
    if (!formData.registered_office_address.trim()) {
      return 'Registered Office Address is required';
    }
    if (!formData.communication_address.trim()) {
      return 'Communication Address is required';
    }
    if (formData.pay_basis === 'TBB') {
      if (!formData.credit_days || formData.credit_days <= 0) {
        return 'Credit Days is required when Pay Basis is TBB';
      }
      if (!formData.billing_cycle) {
        return 'Billing Cycle is required when Pay Basis is TBB';
      }
      if (!formData.billing_instance) {
        return 'Billing Instance is required when Pay Basis is TBB';
      }
      if (!formData.auto_billing) {
        return 'Auto Billing is required when Pay Basis is TBB';
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setSaving(true);

    try {
      const submitData: any = {
        customer_name: formData.customer_name,
        customer_classification: formData.customer_classification,
        pay_basis: formData.pay_basis,
        gst_applicable: formData.gst_applicable === 'Yes',
        sales_person_id: formData.sales_person_id || null,
        gst_number: formData.gst_number || null,
        contact_person: formData.contact_person,
        contact_mobile: formData.contact_mobile,
        email: formData.email,
        registered_office_address: formData.registered_office_address,
        registered_office_city: formData.registered_office_city || null,
        registered_office_state: formData.registered_office_state || null,
        communication_address: formData.communication_address,
        communication_city: formData.communication_city || null,
        communication_state: formData.communication_state || null,
        remarks: formData.remarks || null,
      };

      if (formData.pay_basis === 'TBB') {
        submitData.credit_days = formData.credit_days;
        submitData.billing_cycle = formData.billing_cycle;
        submitData.billing_instance = formData.billing_instance;
        submitData.auto_billing = formData.auto_billing === 'Yes';
      } else {
        submitData.credit_days = null;
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
        const { error } = await supabase
          .from('customers')
          .insert([submitData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
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
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('customer_id', id);

      if (error) throw error;
      loadCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      alert(error.message || 'Failed to delete customer');
    }
  }

  function openEditModal(customer: any) {
    setEditingCustomer(customer);
    setFormData({
      customer_name: customer.customer_name || '',
      customer_classification: customer.customer_classification || '',
      pay_basis: customer.pay_basis || '',
      gst_applicable: customer.gst_applicable ? 'Yes' : 'No',
      sales_person_id: customer.sales_person_id || '',
      gst_number: customer.gst_number || '',
      contact_person: customer.contact_person || '',
      contact_mobile: customer.contact_mobile || '',
      email: customer.email || '',
      registered_office_address: customer.registered_office_address || customer.billing_address || '',
      registered_office_city: customer.registered_office_city || '',
      registered_office_state: customer.registered_office_state || '',
      communication_address: customer.communication_address || '',
      communication_city: customer.communication_city || '',
      communication_state: customer.communication_state || '',
      credit_days: customer.credit_days || 0,
      billing_cycle: customer.billing_cycle || '',
      billing_instance: customer.billing_instance || '',
      auto_billing: customer.auto_billing ? 'Yes' : 'No',
      remarks: customer.remarks || '',
    });
    setSameAsRegistered(false);
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingCustomer(null);
    resetForm();
    setSameAsRegistered(false);
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      customer_name: '',
      customer_classification: '',
      pay_basis: '',
      gst_applicable: '',
      sales_person_id: '',
      gst_number: '',
      contact_person: '',
      contact_mobile: '',
      email: '',
      registered_office_address: '',
      registered_office_city: '',
      registered_office_state: '',
      communication_address: '',
      communication_city: '',
      communication_state: '',
      credit_days: 0,
      billing_cycle: '',
      billing_instance: '',
      auto_billing: '',
      remarks: '',
    });
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Customers</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classification</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Basis</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No customers found</td></tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.customer_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{customer.customer_name}</td>
                  <td className="px-6 py-4">{customer.customer_classification}</td>
                  <td className="px-6 py-4">{customer.pay_basis}</td>
                  <td className="px-6 py-4">{customer.contact_person}</td>
                  <td className="px-6 py-4">{customer.contact_mobile}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEditModal(customer)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg mr-2 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
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
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCustomer(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {editingCustomer && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.customer_id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Classification <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="customer_classification"
                        value="Corporate"
                        checked={formData.customer_classification === 'Corporate'}
                        onChange={(e) => setFormData({ ...formData, customer_classification: e.target.value })}
                        className="mr-2"
                        required
                      />
                      Corporate
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="customer_classification"
                        value="Broker"
                        checked={formData.customer_classification === 'Broker'}
                        onChange={(e) => setFormData({ ...formData, customer_classification: e.target.value })}
                        className="mr-2"
                      />
                      Broker
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pay Basis <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pay_basis"
                        value="Paid"
                        checked={formData.pay_basis === 'Paid'}
                        onChange={(e) => setFormData({ ...formData, pay_basis: e.target.value })}
                        className="mr-2"
                        required
                      />
                      Paid
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pay_basis"
                        value="To Pay"
                        checked={formData.pay_basis === 'To Pay'}
                        onChange={(e) => setFormData({ ...formData, pay_basis: e.target.value })}
                        className="mr-2"
                      />
                      To Pay
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pay_basis"
                        value="TBB"
                        checked={formData.pay_basis === 'TBB'}
                        onChange={(e) => setFormData({ ...formData, pay_basis: e.target.value })}
                        className="mr-2"
                      />
                      TBB
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Applicable <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gst_applicable"
                        value="Yes"
                        checked={formData.gst_applicable === 'Yes'}
                        onChange={(e) => setFormData({ ...formData, gst_applicable: e.target.value })}
                        className="mr-2"
                        required
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gst_applicable"
                        value="No"
                        checked={formData.gst_applicable === 'No'}
                        onChange={(e) => setFormData({ ...formData, gst_applicable: e.target.value, gst_number: '' })}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sales Person
                  </label>
                  <select
                    value={formData.sales_person_id}
                    onChange={(e) => setFormData({ ...formData, sales_person_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Sales Person</option>
                    {salesPersons.map((sp) => (
                      <option key={sp.user_id} value={sp.user_id}>
                        {sp.employee_code} - {sp.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.gst_applicable === 'Yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={formData.gst_applicable === 'Yes'}
                      value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_mobile}
                    onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="9876543210 or 9876543210, 9876543211"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple numbers with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@example.com or email1@example.com, email2@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold mb-4">Registered Office Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.registered_office_address}
                      onChange={(e) => setFormData({ ...formData, registered_office_address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <CityAutocomplete
                      value={formData.registered_office_city}
                      onChange={(value) => setFormData({ ...formData, registered_office_city: value })}
                      placeholder="Search or enter city..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.registered_office_state}
                      onChange={(e) => setFormData({ ...formData, registered_office_state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      list="states-list"
                      placeholder="Search or enter state..."
                    />
                    <datalist id="states-list">
                      {states.map((state) => (
                        <option key={state.state_name} value={state.state_name} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Communication Address</h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sameAsRegistered}
                      onChange={(e) => handleSameAsRegistered(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Same as Registered Office Address</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.communication_address}
                      onChange={(e) => setFormData({ ...formData, communication_address: e.target.value })}
                      rows={2}
                      disabled={sameAsRegistered}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <CityAutocomplete
                      value={formData.communication_city}
                      onChange={(value) => setFormData({ ...formData, communication_city: value })}
                      disabled={sameAsRegistered}
                      placeholder="Search or enter city..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.communication_state}
                      onChange={(e) => setFormData({ ...formData, communication_state: e.target.value })}
                      disabled={sameAsRegistered}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      list="states-list"
                      placeholder="Search or enter state..."
                    />
                  </div>
                </div>
              </div>

              {formData.pay_basis === 'TBB' && (
                <div className="border-t pt-6 bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4">TBB Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Credit Days <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.credit_days || ''}
                        onChange={(e) => setFormData({ ...formData, credit_days: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Cycle <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Daily', 'Weekly', 'Fortnightly', 'Monthly'].map((cycle) => (
                          <label key={cycle} className="flex items-center">
                            <input
                              type="radio"
                              name="billing_cycle"
                              value={cycle}
                              checked={formData.billing_cycle === cycle}
                              onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                              className="mr-2"
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
                          <label key={instance} className="flex items-center">
                            <input
                              type="radio"
                              name="billing_instance"
                              value={instance}
                              checked={formData.billing_instance === instance}
                              onChange={(e) => setFormData({ ...formData, billing_instance: e.target.value })}
                              className="mr-2"
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
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="auto_billing"
                            value="Yes"
                            checked={formData.auto_billing === 'Yes'}
                            onChange={(e) => setFormData({ ...formData, auto_billing: e.target.value })}
                            className="mr-2"
                            required
                          />
                          Yes
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="auto_billing"
                            value="No"
                            checked={formData.auto_billing === 'No'}
                            onChange={(e) => setFormData({ ...formData, auto_billing: e.target.value })}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                    resetForm();
                  }}
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
    </div>
  );
}
