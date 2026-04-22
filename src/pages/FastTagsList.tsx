import { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, X, Wifi, Building2, Hash, Car, Banknote } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FastTag {
  fast_tag_id: string;
  vehicle_number: string;
  wallet_id: string;
  tag_number: string;
  provider: string;
  balance: number;
  remarks: string;
  is_active: boolean;
}

interface Vehicle {
  vehicle_id: string;
  vehicle_number: string;
}

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

const EMPTY_FORM = {
  vehicle_number: '',
  wallet_id: '',
  tag_number: '',
  provider: '',
  balance: 0,
  remarks: '',
};

export function FastTagsList() {
  const [fastTags, setFastTags] = useState<FastTag[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<FastTag | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    loadFastTags();
    loadVehicles();
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

  async function loadVehicles() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('vehicle_id, vehicle_number')
        .order('vehicle_number');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
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
      setFormData({ ...EMPTY_FORM });
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
      tag_number: tag.tag_number || '',
      provider: tag.provider || '',
      balance: tag.balance || 0,
      remarks: tag.remarks || '',
    });
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingTag(null);
    setFormData({ ...EMPTY_FORM });
    setShowModal(true);
  }

  const mappedNumbers = new Set(fastTags.map((t) => t.vehicle_number));

  const availableVehicles = vehicles.filter(
    (v) => !mappedNumbers.has(v.vehicle_number) || (editingTag && v.vehicle_number === editingTag.vehicle_number)
  );

  const filteredTags = fastTags.filter(
    (tag) =>
      tag.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tag.wallet_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tag.provider || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by vehicle number, wallet ID, or provider..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading...</td>
                </tr>
              ) : filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No FASTags found</td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr key={tag.fast_tag_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{tag.vehicle_number}</td>
                    <td className="px-6 py-4 text-gray-600">{tag.wallet_id || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{tag.tag_number || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{tag.provider || '-'}</td>
                    <td className="px-6 py-4 text-right text-gray-600">₹{(tag.balance || 0).toLocaleString()}</td>
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

                {/* Vehicle */}
                <div>
                  <SectionHeading icon={Car} title="Vehicle" />
                  <div>
                    <label className={LABEL_CLS}>Vehicle Number <span className="text-red-500 normal-case">*</span></label>
                    <select
                      required
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                      className={INPUT_CLS}
                    >
                      <option value="">Select Vehicle</option>
                      {availableVehicles.map((v) => (
                        <option key={v.vehicle_id} value={v.vehicle_number}>
                          {v.vehicle_number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tag Details */}
                <div>
                  <SectionHeading icon={Hash} title="Tag Details" />
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
                      <label className={LABEL_CLS}>Tag Number</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Optional"
                          value={formData.tag_number}
                          onChange={(e) => setFormData({ ...formData, tag_number: e.target.value })}
                          className={`${INPUT_CLS} pl-9`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Provider & Balance */}
                <div>
                  <SectionHeading icon={Building2} title="Provider & Balance" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL_CLS}>Provider</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="e.g. HDFC Bank"
                          value={formData.provider}
                          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
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
