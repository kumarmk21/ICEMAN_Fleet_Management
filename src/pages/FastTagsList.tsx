import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FastTag {
  fast_tag_id: string;
  vehicle_number: string;
  wallet_id: string;
  customer_id: string;
  tag_account_number: string;
  mobile_number: string;
  tag_id: string;
  vehicle_class: string;
  issuer_bank: string;
  balance: number;
  status: string;
  issue_date: string;
  expiry_date: string;
  remarks: string;
  is_active: boolean;
}

export function FastTagsList() {
  const [fastTags, setFastTags] = useState<FastTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<FastTag | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    wallet_id: '',
    customer_id: '',
    tag_account_number: '',
    mobile_number: '',
    tag_id: '',
    vehicle_class: '',
    issuer_bank: '',
    balance: 0,
    status: 'Active',
    issue_date: '',
    expiry_date: '',
    remarks: '',
  });

  useEffect(() => {
    loadFastTags();
  }, []);

  async function loadFastTags() {
    try {
      const { data, error } = await supabase
        .from('fast_tags_master')
        .select('*')
        .eq('is_active', true)
        .order('vehicle_number');

      if (error) throw error;
      setFastTags(data || []);
    } catch (error) {
      console.error('Error loading fast tags:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingTag) {
        const { error } = await supabase
          .from('fast_tags_master')
          .update(formData)
          .eq('fast_tag_id', editingTag.fast_tag_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fast_tags_master')
          .insert(formData);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingTag(null);
      resetForm();
      loadFastTags();
    } catch (error: any) {
      console.error('Error saving fast tag:', error);
      alert(error.message || 'Failed to save fast tag');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this FASTag?')) return;

    try {
      const { error } = await supabase
        .from('fast_tags_master')
        .update({ is_active: false })
        .eq('fast_tag_id', id);

      if (error) throw error;
      loadFastTags();
    } catch (error: any) {
      alert(error.message);
    }
  }

  function openEditModal(tag: FastTag) {
    setEditingTag(tag);
    setFormData({
      vehicle_number: tag.vehicle_number,
      wallet_id: tag.wallet_id,
      customer_id: tag.customer_id || '',
      tag_account_number: tag.tag_account_number || '',
      mobile_number: tag.mobile_number,
      tag_id: tag.tag_id || '',
      vehicle_class: tag.vehicle_class || '',
      issuer_bank: tag.issuer_bank || '',
      balance: tag.balance || 0,
      status: tag.status,
      issue_date: tag.issue_date || '',
      expiry_date: tag.expiry_date || '',
      remarks: tag.remarks || '',
    });
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingTag(null);
    resetForm();
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      vehicle_number: '',
      wallet_id: '',
      customer_id: '',
      tag_account_number: '',
      mobile_number: '',
      tag_id: '',
      vehicle_class: '',
      issuer_bank: '',
      balance: 0,
      status: 'Active',
      issue_date: '',
      expiry_date: '',
      remarks: '',
    });
  }

  const filteredTags = fastTags.filter(
    (tag) =>
      tag.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.wallet_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.mobile_number.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by vehicle number, wallet ID, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add FASTag
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issuer Bank</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">Loading...</td>
                </tr>
              ) : filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No FASTags found</td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr key={tag.fast_tag_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{tag.vehicle_number}</td>
                    <td className="px-6 py-4 text-gray-600">{tag.wallet_id}</td>
                    <td className="px-6 py-4 text-gray-600">{tag.mobile_number}</td>
                    <td className="px-6 py-4 text-gray-600">{tag.issuer_bank || '-'}</td>
                    <td className="px-6 py-4 text-right text-gray-600">₹{tag.balance.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          tag.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : tag.status === 'Blocked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tag.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(tag)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag.fast_tag_id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">
                {editingTag ? 'Edit FASTag' : 'Add New FASTag'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wallet ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.wallet_id}
                    onChange={(e) => setFormData({ ...formData, wallet_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.tag_account_number}
                    onChange={(e) => setFormData({ ...formData, tag_account_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag ID
                  </label>
                  <input
                    type="text"
                    value={formData.tag_id}
                    onChange={(e) => setFormData({ ...formData, tag_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Class
                  </label>
                  <select
                    value={formData.vehicle_class}
                    onChange={(e) => setFormData({ ...formData, vehicle_class: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Class</option>
                    <option value="Car/Jeep/Van">Car/Jeep/Van</option>
                    <option value="Light Commercial Vehicle">Light Commercial Vehicle</option>
                    <option value="Bus/Truck">Bus/Truck</option>
                    <option value="Heavy Construction Vehicle">Heavy Construction Vehicle</option>
                    <option value="Multi Axle Vehicle">Multi Axle Vehicle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issuer Bank
                  </label>
                  <input
                    type="text"
                    value={formData.issuer_bank}
                    onChange={(e) => setFormData({ ...formData, issuer_bank: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-blue-400"
                >
                  {saving ? 'Saving...' : editingTag ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
