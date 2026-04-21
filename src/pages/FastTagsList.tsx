import { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, X, CreditCard, Wifi, Calendar, Building2, Hash, Phone, Car, Banknote } from 'lucide-react';
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

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Inactive: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  Blocked: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  Suspended: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
};

const INPUT_CLS = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all';
const LABEL_CLS = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <span className="text-sm font-semibold text-gray-700">{title}</span>
      <div className="flex-1 h-px bg-gray-100 ml-1" />
    </div>
  );
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
      wallet_id: tag.wallet_id || '',
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
      (tag.wallet_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tag.mobile_number || '').includes(searchTerm)
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
                    <td className="px-6 py-4 text-gray-600">{tag.wallet_id || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{tag.mobile_number}</td>
                    <td className="px-6 py-4 text-gray-600">{tag.issuer_bank || '-'}</td>
                    <td className="px-6 py-4 text-right text-gray-600">₹{tag.balance.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[tag.status] || STATUS_STYLES.Inactive}`}>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingTag ? 'Edit FASTag' : 'Add New FASTag'}
                  </h2>
                  <p className="text-blue-100 text-xs mt-0.5">
                    {editingTag ? 'Update FASTag details' : 'Register a new FASTag account'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">

                {/* Vehicle & Contact */}
                <div>
                  <SectionHeading icon={Car} title="Vehicle & Contact" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL_CLS}>Vehicle Number <span className="text-red-500 normal-case">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MH12AB1234"
                        value={formData.vehicle_number}
                        onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Mobile Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          pattern="[0-9]{10}"
                          placeholder="Optional"
                          value={formData.mobile_number}
                          onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                          className={`${INPUT_CLS} pl-9`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Vehicle Class</label>
                      <select
                        value={formData.vehicle_class}
                        onChange={(e) => setFormData({ ...formData, vehicle_class: e.target.value })}
                        className={INPUT_CLS}
                      >
                        <option value="">Select Class</option>
                        <option value="Car/Jeep/Van">Car / Jeep / Van</option>
                        <option value="Light Commercial Vehicle">Light Commercial Vehicle</option>
                        <option value="Bus/Truck">Bus / Truck</option>
                        <option value="Heavy Construction Vehicle">Heavy Construction Vehicle</option>
                        <option value="Multi Axle Vehicle">Multi Axle Vehicle</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className={INPUT_CLS}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tag & Account Details */}
                <div>
                  <SectionHeading icon={CreditCard} title="Tag & Account Details" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL_CLS}>Wallet ID</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Optional"
                          value={formData.wallet_id}
                          onChange={(e) => setFormData({ ...formData, wallet_id: e.target.value })}
                          className={`${INPUT_CLS} pl-9`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Tag ID</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Optional"
                          value={formData.tag_id}
                          onChange={(e) => setFormData({ ...formData, tag_id: e.target.value })}
                          className={`${INPUT_CLS} pl-9`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Tag Account Number</label>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={formData.tag_account_number}
                        onChange={(e) => setFormData({ ...formData, tag_account_number: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Customer ID</label>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={formData.customer_id}
                        onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>
                </div>

                {/* Bank & Balance */}
                <div>
                  <SectionHeading icon={Building2} title="Bank & Balance" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL_CLS}>Issuer Bank</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="e.g. HDFC Bank"
                          value={formData.issuer_bank}
                          onChange={(e) => setFormData({ ...formData, issuer_bank: e.target.value })}
                          className={`${INPUT_CLS} pl-9`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Balance (₹)</label>
                      <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.balance}
                          onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                          className={`${INPUT_CLS} pl-9`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validity */}
                <div>
                  <SectionHeading icon={Calendar} title="Validity" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL_CLS}>Issue Date</label>
                      <input
                        type="date"
                        value={formData.issue_date}
                        onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Expiry Date</label>
                      <input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={LABEL_CLS}>Remarks</label>
                      <textarea
                        rows={2}
                        placeholder="Any additional notes..."
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingTag ? 'Update FASTag' : 'Add FASTag'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
