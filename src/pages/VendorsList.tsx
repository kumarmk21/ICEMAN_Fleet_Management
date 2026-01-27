import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Eye, Download, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VendorForm {
  vendor_name: string;
  vendor_type: string;
  gst_number: string;
  address: string;
  contact_person: string;
  contact_mobile: string;
  email: string;
  remarks: string;
  pan_number: string;
  tds_applicable: boolean;
  tds_category: string;
}

export function VendorsList() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingVendor, setViewingVendor] = useState<any>(null);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<VendorForm>({
    vendor_name: '',
    vendor_type: 'Other',
    gst_number: '',
    address: '',
    contact_person: '',
    contact_mobile: '',
    email: '',
    remarks: '',
    pan_number: '',
    tds_applicable: false,
    tds_category: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('vendor_name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(vendorId: string) {
    if (!selectedFile) return null;

    try {
      setUploadingFile(true);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${vendorId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(filePath);

      return {
        url: filePath,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      let fileData = null;

      if (editingVendor) {
        if (selectedFile) {
          fileData = await handleFileUpload(editingVendor.vendor_id);
        }

        const updateData: any = { ...formData };
        if (fileData) {
          updateData.pan_document_url = fileData.url;
          updateData.pan_file_name = fileData.fileName;
          updateData.pan_file_size = fileData.fileSize;
          updateData.pan_file_type = fileData.fileType;
        }

        const { error } = await supabase
          .from('vendors')
          .update(updateData)
          .eq('vendor_id', editingVendor.vendor_id);

        if (error) throw error;
      } else {
        const { data: insertedVendor, error: insertError } = await supabase
          .from('vendors')
          .insert([formData])
          .select()
          .single();

        if (insertError) throw insertError;

        if (selectedFile && insertedVendor) {
          fileData = await handleFileUpload(insertedVendor.vendor_id);

          const { error: updateError } = await supabase
            .from('vendors')
            .update({
              pan_document_url: fileData.url,
              pan_file_name: fileData.fileName,
              pan_file_size: fileData.fileSize,
              pan_file_type: fileData.fileType
            })
            .eq('vendor_id', insertedVendor.vendor_id);

          if (updateError) throw updateError;
        }
      }

      setShowModal(false);
      setEditingVendor(null);
      setSelectedFile(null);
      resetForm();
      loadVendors();
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      alert(error.message || 'Failed to save vendor');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('vendor_id', id);

      if (error) throw error;
      loadVendors();
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      alert(error.message || 'Failed to delete vendor');
    }
  }

  function openEditModal(vendor: any) {
    setEditingVendor(vendor);
    setFormData({
      vendor_name: vendor.vendor_name,
      vendor_type: vendor.vendor_type,
      gst_number: vendor.gst_number || '',
      address: vendor.address || '',
      contact_person: vendor.contact_person || '',
      contact_mobile: vendor.contact_mobile || '',
      email: vendor.email || '',
      remarks: vendor.remarks || '',
      pan_number: vendor.pan_number || '',
      tds_applicable: vendor.tds_applicable || false,
      tds_category: vendor.tds_category || '',
    });
    setSelectedFile(null);
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingVendor(null);
    setSelectedFile(null);
    resetForm();
    setShowModal(true);
  }

  function openViewModal(vendor: any) {
    setViewingVendor(vendor);
    setShowViewModal(true);
  }

  function resetForm() {
    setFormData({
      vendor_name: '',
      vendor_type: 'Other',
      gst_number: '',
      address: '',
      contact_person: '',
      contact_mobile: '',
      email: '',
      remarks: '',
      pan_number: '',
      tds_applicable: false,
      tds_category: '',
    });
    setSelectedFile(null);
  }

  async function downloadPanDocument(vendor: any) {
    if (!vendor.pan_document_url) return;

    try {
      const { data, error } = await supabase.storage
        .from('vendor-documents')
        .download(vendor.pan_document_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = vendor.pan_file_name || 'pan-document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      alert('Failed to download document');
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Vendors</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Vendor
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PAN Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TDS Applicable</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center">Loading...</td></tr>
            ) : vendors.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No vendors found</td></tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.vendor_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{vendor.vendor_name}</td>
                  <td className="px-6 py-4">{vendor.vendor_type}</td>
                  <td className="px-6 py-4">{vendor.pan_number || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      vendor.tds_applicable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vendor.tds_applicable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{vendor.contact_mobile}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openViewModal(vendor)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-50 rounded-lg mr-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(vendor)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg mr-2 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.vendor_id)}
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
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingVendor(null);
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
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.vendor_type}
                    onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Fuel">Fuel</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Tyre">Tyre</option>
                    <option value="Toll">Toll</option>
                    <option value="Market">Market</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Mobile</label>
                  <input
                    type="tel"
                    value={formData.contact_mobile}
                    onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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

                <div className="col-span-2 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">TDS & PAN Details</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pan_number}
                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TDS Applicable <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.tds_applicable ? 'true' : 'false'}
                    onChange={(e) => {
                      const isApplicable = e.target.value === 'true';
                      setFormData({
                        ...formData,
                        tds_applicable: isApplicable,
                        tds_category: isApplicable ? formData.tds_category : ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                {formData.tds_applicable && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TDS Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.tds_category}
                      onChange={(e) => setFormData({ ...formData, tds_category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Individual">Individual</option>
                    </select>
                  </div>
                )}

                <div className={formData.tds_applicable ? "col-span-1" : "col-span-2"}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Document Upload {editingVendor?.pan_document_url ? '' : <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!editingVendor?.pan_document_url}
                    />
                    {editingVendor?.pan_document_url && (
                      <button
                        type="button"
                        onClick={() => downloadPanDocument(editingVendor)}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        Current
                      </button>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                  {editingVendor?.pan_file_name && !selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current file: {editingVendor.pan_file_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingVendor(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {saving || uploadingFile ? 'Saving...' : editingVendor ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Vendor Details</h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingVendor(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Vendor Name</h4>
                  <p className="text-gray-900 font-medium">{viewingVendor.vendor_name}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Vendor Type</h4>
                  <p className="text-gray-900">{viewingVendor.vendor_type}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">GST Number</h4>
                  <p className="text-gray-900">{viewingVendor.gst_number || '-'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">PAN Number</h4>
                  <p className="text-gray-900">{viewingVendor.pan_number || '-'}</p>
                </div>

                <div className="col-span-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Address</h4>
                  <p className="text-gray-900">{viewingVendor.address || '-'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Contact Person</h4>
                  <p className="text-gray-900">{viewingVendor.contact_person || '-'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Contact Mobile</h4>
                  <p className="text-gray-900">{viewingVendor.contact_mobile || '-'}</p>
                </div>

                <div className="col-span-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</h4>
                  <p className="text-gray-900">{viewingVendor.email || '-'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">TDS Applicable</h4>
                  <p className="text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      viewingVendor.tds_applicable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingVendor.tds_applicable ? 'Yes' : 'No'}
                    </span>
                  </p>
                </div>

                {viewingVendor.tds_applicable && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">TDS Category</h4>
                    <p className="text-gray-900">{viewingVendor.tds_category || '-'}</p>
                  </div>
                )}

                {viewingVendor.pan_document_url && (
                  <div className="col-span-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">PAN Document</h4>
                    <button
                      onClick={() => downloadPanDocument(viewingVendor)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download {viewingVendor.pan_file_name || 'PAN Document'}
                      {viewingVendor.pan_file_size && (
                        <span className="text-xs text-gray-500">
                          ({(viewingVendor.pan_file_size / 1024).toFixed(2)} KB)
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {viewingVendor.remarks && (
                  <div className="col-span-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Remarks</h4>
                    <p className="text-gray-900 whitespace-pre-wrap">{viewingVendor.remarks}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingVendor(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(viewingVendor);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
