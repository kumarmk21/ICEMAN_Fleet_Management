import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GSTForm {
  customer_id: string;
  hsn_sac_code: string;
  description: string;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  effective_from: string;
  effective_to: string;
  is_active: boolean;
  remarks: string;
}

interface Customer {
  customer_id: string;
  customer_name: string;
}

export function GSTMasterList() {
  const [gstRecords, setGstRecords] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<GSTForm>({
    customer_id: '',
    hsn_sac_code: '',
    description: '',
    cgst_rate: 0,
    sgst_rate: 0,
    igst_rate: 0,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    is_active: true,
    remarks: '',
  });

  useEffect(() => {
    loadGSTRecords();
    loadCustomers();
  }, []);

  async function loadGSTRecords() {
    try {
      const { data, error } = await supabase
        .from('gst_master')
        .select(`
          *,
          customers (
            customer_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGstRecords(data || []);
    } catch (error) {
      console.error('Error loading GST records:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('customer_id, customer_name')
        .order('customer_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const submitData = {
        ...formData,
        cgst_rate: Number(formData.cgst_rate),
        sgst_rate: Number(formData.sgst_rate),
        igst_rate: Number(formData.igst_rate),
        effective_to: formData.effective_to || null,
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('gst_master')
          .update(submitData)
          .eq('gst_id', editingRecord.gst_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gst_master')
          .insert([submitData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingRecord(null);
      resetForm();
      loadGSTRecords();
    } catch (error: any) {
      console.error('Error saving GST record:', error);
      alert(error.message || 'Failed to save GST record');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this GST record?')) return;

    try {
      const { error } = await supabase
        .from('gst_master')
        .delete()
        .eq('gst_id', id);

      if (error) throw error;
      loadGSTRecords();
    } catch (error: any) {
      console.error('Error deleting GST record:', error);
      alert(error.message || 'Failed to delete GST record');
    }
  }

  function openEditModal(record: any) {
    setEditingRecord(record);
    setFormData({
      customer_id: record.customer_id,
      hsn_sac_code: record.hsn_sac_code || '',
      description: record.description || '',
      cgst_rate: record.cgst_rate || 0,
      sgst_rate: record.sgst_rate || 0,
      igst_rate: record.igst_rate || 0,
      effective_from: record.effective_from || new Date().toISOString().split('T')[0],
      effective_to: record.effective_to || '',
      is_active: record.is_active ?? true,
      remarks: record.remarks || '',
    });
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingRecord(null);
    resetForm();
    setShowModal(true);
  }

  function openViewModal(record: any) {
    setViewingRecord(record);
    setShowViewModal(true);
  }

  function resetForm() {
    setFormData({
      customer_id: '',
      hsn_sac_code: '',
      description: '',
      cgst_rate: 0,
      sgst_rate: 0,
      igst_rate: 0,
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: '',
      is_active: true,
      remarks: '',
    });
  }

  function calculateIGST() {
    const igst = Number(formData.cgst_rate) + Number(formData.sgst_rate);
    setFormData({ ...formData, igst_rate: igst });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">GST Master</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add GST Record
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HSN/SAC Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CGST %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SGST %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IGST %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center">Loading...</td></tr>
            ) : gstRecords.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No GST records found</td></tr>
            ) : (
              gstRecords.map((record) => (
                <tr key={record.gst_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{record.customers?.customer_name}</td>
                  <td className="px-6 py-4">{record.hsn_sac_code || '-'}</td>
                  <td className="px-6 py-4">{record.description || '-'}</td>
                  <td className="px-6 py-4">{record.cgst_rate}%</td>
                  <td className="px-6 py-4">{record.sgst_rate}%</td>
                  <td className="px-6 py-4">{record.igst_rate}%</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {record.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openViewModal(record)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-50 rounded-lg mr-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(record)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg mr-2 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(record.gst_id)}
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {editingRecord ? 'Edit GST Record' : 'Add New GST Record'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingRecord(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.customer_id} value={customer.customer_id}>
                        {customer.customer_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HSN/SAC Code
                  </label>
                  <input
                    type="text"
                    value={formData.hsn_sac_code}
                    onChange={(e) => setFormData({ ...formData, hsn_sac_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 996511"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Description of goods or services"
                  />
                </div>

                <div className="col-span-2 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">GST Rates</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CGST Rate (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.cgst_rate}
                    onChange={(e) => setFormData({ ...formData, cgst_rate: Number(e.target.value) })}
                    onBlur={calculateIGST}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SGST Rate (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.sgst_rate}
                    onChange={(e) => setFormData({ ...formData, sgst_rate: Number(e.target.value) })}
                    onBlur={calculateIGST}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IGST Rate (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.igst_rate}
                    onChange={(e) => setFormData({ ...formData, igst_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="Auto-calculated as CGST + SGST"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Typically CGST + SGST = IGST
                  </p>
                </div>

                <div className="col-span-2 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Effective Period</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Effective From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Effective To
                  </label>
                  <input
                    type="date"
                    value={formData.effective_to}
                    onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty if currently active
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRecord(null);
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
                  {saving ? 'Saving...' : editingRecord ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">GST Record Details</h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingRecord(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Customer Name</h4>
                  <p className="text-gray-900 font-medium">{viewingRecord.customers?.customer_name}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</h4>
                  <p className="text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      viewingRecord.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingRecord.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">HSN/SAC Code</h4>
                  <p className="text-gray-900">{viewingRecord.hsn_sac_code || '-'}</p>
                </div>

                <div className="col-span-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</h4>
                  <p className="text-gray-900">{viewingRecord.description || '-'}</p>
                </div>

                <div className="col-span-2 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">GST Rates</h4>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">CGST Rate</h4>
                  <p className="text-gray-900 text-lg font-semibold">{viewingRecord.cgst_rate}%</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">SGST Rate</h4>
                  <p className="text-gray-900 text-lg font-semibold">{viewingRecord.sgst_rate}%</p>
                </div>

                <div className="col-span-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">IGST Rate</h4>
                  <p className="text-gray-900 text-lg font-semibold">{viewingRecord.igst_rate}%</p>
                </div>

                <div className="col-span-2 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Effective Period</h4>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Effective From</h4>
                  <p className="text-gray-900">
                    {viewingRecord.effective_from ? new Date(viewingRecord.effective_from).toLocaleDateString('en-IN') : '-'}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Effective To</h4>
                  <p className="text-gray-900">
                    {viewingRecord.effective_to ? new Date(viewingRecord.effective_to).toLocaleDateString('en-IN') : 'Currently Active'}
                  </p>
                </div>

                {viewingRecord.remarks && (
                  <div className="col-span-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Remarks</h4>
                    <p className="text-gray-900 whitespace-pre-wrap">{viewingRecord.remarks}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingRecord(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(viewingRecord);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
