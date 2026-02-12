import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Upload, Eye, Download, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VehicleType {
  vehicle_type_id: string;
  vehicle_type_name: string;
  capacity_tons: number;
}

interface DieselCard {
  diesel_card_id: string;
  card_name: string;
  card_number: string;
}

interface FastTag {
  fast_tag_id: string;
  vehicle_number: string;
  wallet_id: string;
}

interface DocumentType {
  document_type_id: string;
  document_type_name: string;
}

interface Vehicle {
  vehicle_id: string;
  vehicle_number: string;
  vehicle_type: string;
  vehicle_type_id: string | null;
  ownership_type: string;
  make: string;
  model: string;
  year_of_manufacture: number | null;
  capacity_tons: number;
  registration_number: string;
  engine_number: string;
  chassis_number: string;
  odometer_current: number;
  fast_tag: string;
  diesel_card_id: string | null;
  status: string;
  vehicle_status: string;
  fixed_cost_per_month: number;
  remarks: string;
}

interface VehicleDocument {
  id: string;
  document_type_id: string;
  document_number: string;
  valid_from: string;
  valid_to: string;
  remarks: string;
  file: File | null;
}

interface StoredVehicleDocument {
  document_id: string;
  vehicle_id: string;
  document_type_id: string;
  document_number: string;
  valid_from: string;
  valid_to: string;
  remarks: string;
  file_name: string;
  file_size: number;
  file_type: string;
  attachment_url: string;
  document_types?: {
    document_type_name: string;
  };
}

const MAX_FILE_SIZE = 500 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

export function VehiclesList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [dieselCards, setDieselCards] = useState<DieselCard[]>([]);
  const [fastTags, setFastTags] = useState<FastTag[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [vehicleDocuments, setVehicleDocuments] = useState<StoredVehicleDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentPreview, setDocumentPreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type_id: '',
    vehicle_category: '',
    ownership_type: 'Owned',
    make: '',
    model: '',
    year_of_manufacture: new Date().getFullYear(),
    capacity_tons: 0,
    registration_number: '',
    engine_number: '',
    chassis_number: '',
    odometer_current: 0,
    fast_tag_id: '',
    diesel_card_id: '',
    standard_fuel_cost_reefer: 0,
    standard_fuel_cost_dry: 0,
    standard_fuel_cost_empty: 0,
    status: 'Active',
    vehicle_status: 'Active',
    emi_per_month: 0,
    remarks: '',
  });
  const [documents, setDocuments] = useState<VehicleDocument[]>([
    {
      id: crypto.randomUUID(),
      document_type_id: '',
      document_number: '',
      valid_from: '',
      valid_to: '',
      remarks: '',
      file: null,
    },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      await Promise.all([
        loadVehicles(),
        loadVehicleTypes(),
        loadDieselCards(),
        loadFastTags(),
        loadDocumentTypes(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_types_master(vehicle_type_name)
      `)
      .order('vehicle_number');

    if (error) throw error;

    const vehiclesWithType = (data || []).map((vehicle: any) => ({
      ...vehicle,
      vehicle_type: vehicle.vehicle_types_master?.vehicle_type_name || vehicle.vehicle_type || 'N/A'
    }));

    setVehicles(vehiclesWithType);
  }

  async function loadVehicleTypes() {
    const { data, error } = await supabase
      .from('vehicle_types_master')
      .select('*')
      .eq('is_active', true)
      .order('vehicle_type_name');

    if (error) throw error;
    setVehicleTypes(data || []);
  }

  async function loadDieselCards() {
    const { data, error } = await supabase
      .from('diesel_cards_master')
      .select('*')
      .eq('is_active', true)
      .order('card_name');

    if (error) throw error;
    setDieselCards(data || []);
  }

  async function loadFastTags() {
    const { data, error } = await supabase
      .from('fast_tags_master')
      .select('fast_tag_id, vehicle_number, wallet_id')
      .eq('is_active', true)
      .order('vehicle_number');

    if (error) throw error;
    setFastTags(data || []);
  }

  async function loadDocumentTypes() {
    const { data, error } = await supabase
      .from('document_types')
      .select('*')
      .order('document_type_name');

    if (error) throw error;
    setDocumentTypes(data || []);
  }

  async function loadVehicleDocuments(vehicleId: string) {
    setLoadingDocuments(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_documents')
        .select('*, document_types(document_type_name)')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicleDocuments(data || []);
    } catch (error) {
      console.error('Error loading vehicle documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  }

  async function openViewModal(vehicle: Vehicle) {
    setViewingVehicle(vehicle);
    setShowViewModal(true);
    await loadVehicleDocuments(vehicle.vehicle_id);
  }

  async function getDocumentUrl(attachmentUrl: string) {
    const { data } = await supabase.storage
      .from('vehicle-documents')
      .createSignedUrl(attachmentUrl, 3600);

    return data?.signedUrl || '';
  }

  async function handleDocumentPreview(doc: StoredVehicleDocument) {
    try {
      const url = await getDocumentUrl(doc.attachment_url);
      setDocumentPreview({
        url,
        type: doc.file_type,
        name: doc.file_name,
      });
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Failed to load document');
    }
  }

  async function handleDocumentDownload(doc: StoredVehicleDocument) {
    try {
      const url = await getDocumentUrl(doc.attachment_url);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  }

  function handleVehicleTypeChange(vehicleTypeId: string) {
    const selectedType = vehicleTypes.find((vt) => vt.vehicle_type_id === vehicleTypeId);
    setFormData({
      ...formData,
      vehicle_type_id: vehicleTypeId,
      capacity_tons: selectedType?.capacity_tons || 0,
    });
  }

  function addDocumentRow() {
    setDocuments([
      ...documents,
      {
        id: crypto.randomUUID(),
        document_type_id: '',
        document_number: '',
        valid_from: '',
        valid_to: '',
        remarks: '',
        file: null,
      },
    ]);
  }

  function removeDocumentRow(id: string) {
    if (documents.length === 1) {
      alert('At least one document row is required');
      return;
    }
    setDocuments(documents.filter((doc) => doc.id !== id));
  }

  function updateDocument(id: string, field: keyof VehicleDocument, value: any) {
    setDocuments(
      documents.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc))
    );
  }

  function handleFileChange(id: string, file: File | null) {
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        alert(
          `File size must be less than 500KB. Current size: ${(file.size / 1024).toFixed(0)}KB`
        );
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert('Only JPG, JPEG, PNG, and PDF files are allowed');
        return;
      }
    }
    updateDocument(id, 'file', file);
  }

  async function uploadDocument(
    vehicleId: string,
    documentTypeId: string,
    documentNumber: string,
    validFrom: string,
    validTo: string,
    remarks: string,
    file: File
  ) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${vehicleId}/${documentNumber.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('vehicle-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { error: docError } = await supabase.from('vehicle_documents').insert({
      vehicle_id: vehicleId,
      document_type_id: documentTypeId,
      document_number: documentNumber,
      valid_from: validFrom || null,
      valid_to: validTo || null,
      remarks: remarks,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      attachment_url: fileName,
    });

    if (docError) throw docError;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      for (const doc of documents) {
        if (!doc.document_type_id) {
          alert('All document fields are mandatory. Please fill in all document details.');
          setSaving(false);
          return;
        }
        if (!doc.document_number) {
          alert('Document Number is required for all documents.');
          setSaving(false);
          return;
        }
        if (!doc.valid_from) {
          alert('Valid From date is required for all documents.');
          setSaving(false);
          return;
        }
        if (!doc.valid_to) {
          alert('Valid To date is required for all documents.');
          setSaving(false);
          return;
        }
        if (!doc.remarks) {
          alert('Remarks are required for all documents.');
          setSaving(false);
          return;
        }
        if (!doc.file) {
          alert('Document file is required for all documents.');
          setSaving(false);
          return;
        }
      }

      const vehicleData = {
        ...formData,
        vehicle_type_id: formData.vehicle_type_id || null,
        diesel_card_id: formData.diesel_card_id || null,
      };

      let vehicleId: string;

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('vehicle_id', editingVehicle.vehicle_id);

        if (error) throw error;
        vehicleId = editingVehicle.vehicle_id;
      } else {
        const { data, error } = await supabase
          .from('vehicles')
          .insert(vehicleData)
          .select()
          .single();

        if (error) throw error;
        vehicleId = data.vehicle_id;
      }

      for (const doc of documents) {
        if (doc.file) {
          await uploadDocument(
            vehicleId,
            doc.document_type_id,
            doc.document_number,
            doc.valid_from,
            doc.valid_to,
            doc.remarks,
            doc.file
          );
        }
      }

      setShowModal(false);
      setEditingVehicle(null);
      resetForm();
      loadVehicles();
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      alert(error.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const { error } = await supabase.from('vehicles').delete().eq('vehicle_id', id);
      if (error) throw error;
      loadVehicles();
    } catch (error: any) {
      alert(error.message);
    }
  }

  function openEditModal(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number,
      vehicle_type_id: vehicle.vehicle_type_id || '',
      vehicle_category: (vehicle as any).vehicle_category || '',
      ownership_type: vehicle.ownership_type,
      make: vehicle.make,
      model: vehicle.model,
      year_of_manufacture: vehicle.year_of_manufacture || new Date().getFullYear(),
      capacity_tons: vehicle.capacity_tons,
      registration_number: vehicle.registration_number,
      engine_number: vehicle.engine_number,
      chassis_number: vehicle.chassis_number,
      odometer_current: vehicle.odometer_current,
      fast_tag_id: (vehicle as any).fast_tag_id || '',
      diesel_card_id: vehicle.diesel_card_id || '',
      standard_fuel_cost_reefer: (vehicle as any).standard_fuel_cost_reefer || 0,
      standard_fuel_cost_dry: (vehicle as any).standard_fuel_cost_dry || 0,
      standard_fuel_cost_empty: (vehicle as any).standard_fuel_cost_empty || 0,
      status: vehicle.status,
      vehicle_status: vehicle.vehicle_status || 'Active',
      emi_per_month: (vehicle as any).emi_per_month || vehicle.fixed_cost_per_month || 0,
      remarks: vehicle.remarks || '',
    });
    setDocuments([
      {
        id: crypto.randomUUID(),
        document_type_id: '',
        document_number: '',
        valid_from: '',
        valid_to: '',
        remarks: '',
        file: null,
      },
    ]);
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingVehicle(null);
    resetForm();
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      vehicle_number: '',
      vehicle_type_id: '',
      vehicle_category: '',
      ownership_type: 'Owned',
      make: '',
      model: '',
      year_of_manufacture: new Date().getFullYear(),
      capacity_tons: 0,
      registration_number: '',
      engine_number: '',
      chassis_number: '',
      odometer_current: 0,
      fast_tag_id: '',
      diesel_card_id: '',
      standard_fuel_cost_reefer: 0,
      standard_fuel_cost_dry: 0,
      standard_fuel_cost_empty: 0,
      status: 'Active',
      vehicle_status: 'Active',
      emi_per_month: 0,
      remarks: '',
    });
    setDocuments([
      {
        id: crypto.randomUUID(),
        document_type_id: '',
        document_number: '',
        valid_from: '',
        valid_to: '',
        remarks: '',
        file: null,
      },
    ]);
  }

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
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
            Add Vehicle
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vehicle Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ownership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No vehicles found
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.vehicle_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {vehicle.vehicle_number}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{vehicle.vehicle_type}</td>
                    <td className="px-6 py-4 text-gray-600">{vehicle.ownership_type}</td>
                    <td className="px-6 py-4 text-gray-600">{vehicle.capacity_tons} TON</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          vehicle.vehicle_status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {vehicle.vehicle_status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openViewModal(vehicle)}
                        className="text-green-600 hover:text-green-800 mr-3"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(vehicle)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.vehicle_id)}
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
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                    Vehicle Type *
                  </label>
                  <select
                    required
                    value={formData.vehicle_type_id}
                    onChange={(e) => handleVehicleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Vehicle Type</option>
                    {vehicleTypes.map((vt) => (
                      <option key={vt.vehicle_type_id} value={vt.vehicle_type_id}>
                        {vt.vehicle_type_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Category *
                  </label>
                  <select
                    required
                    value={formData.vehicle_category}
                    onChange={(e) => setFormData({ ...formData, vehicle_category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Reefer">Reefer</option>
                    <option value="Dry">Dry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ownership Type *
                  </label>
                  <select
                    required
                    value={formData.ownership_type}
                    onChange={(e) => setFormData({ ...formData, ownership_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Owned">Owned</option>
                    <option value="Attached">Attached</option>
                    <option value="Market Vehicle">Market Vehicle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Manufacture *
                  </label>
                  <input
                    type="number"
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.year_of_manufacture}
                    onChange={(e) =>
                      setFormData({ ...formData, year_of_manufacture: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity (Tons) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.capacity_tons}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity_tons: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Engine Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.engine_number}
                    onChange={(e) => setFormData({ ...formData, engine_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chassis Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.chassis_number}
                    onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Odometer Current *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.odometer_current}
                    onChange={(e) =>
                      setFormData({ ...formData, odometer_current: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {formData.ownership_type === 'Owned' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Standard Fuel Cost - Reefer (per KM) *
                      </label>
                      <input
                        type="number"
                        required={formData.ownership_type === 'Owned'}
                        step="0.01"
                        min="0"
                        value={formData.standard_fuel_cost_reefer}
                        onChange={(e) => setFormData({ ...formData, standard_fuel_cost_reefer: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Standard Fuel Cost - Dry (per KM) *
                      </label>
                      <input
                        type="number"
                        required={formData.ownership_type === 'Owned'}
                        step="0.01"
                        min="0"
                        value={formData.standard_fuel_cost_dry}
                        onChange={(e) => setFormData({ ...formData, standard_fuel_cost_dry: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Standard Fuel Cost - Empty (per KM) *
                      </label>
                      <input
                        type="number"
                        required={formData.ownership_type === 'Owned'}
                        step="0.01"
                        min="0"
                        value={formData.standard_fuel_cost_empty}
                        onChange={(e) => setFormData({ ...formData, standard_fuel_cost_empty: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        EMI per Month *
                      </label>
                      <input
                        type="number"
                        required={formData.ownership_type === 'Owned'}
                        step="0.01"
                        min="0"
                        value={formData.emi_per_month}
                        onChange={(e) => setFormData({ ...formData, emi_per_month: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fast Tag
                      </label>
                      <select
                        value={formData.fast_tag_id}
                        onChange={(e) => setFormData({ ...formData, fast_tag_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Fast Tag</option>
                        {fastTags.map((ft) => (
                          <option key={ft.fast_tag_id} value={ft.fast_tag_id}>
                            {ft.vehicle_number} - {ft.wallet_id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diesel Card
                      </label>
                      <select
                        value={formData.diesel_card_id}
                        onChange={(e) => setFormData({ ...formData, diesel_card_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Diesel Card</option>
                        {dieselCards.map((dc) => (
                          <option key={dc.diesel_card_id} value={dc.diesel_card_id}>
                            {dc.card_name} ({dc.card_number})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Under Maintenance</option>
                    <option>Sold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Status *</label>
                  <select
                    required
                    value={formData.vehicle_status}
                    onChange={(e) => setFormData({ ...formData, vehicle_status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.registration_number}
                    onChange={(e) =>
                      setFormData({ ...formData, registration_number: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>


                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Vehicle Documents *</h3>
                    <p className="text-sm text-gray-600">
                      All fields are mandatory (JPG, JPEG, PNG, PDF - Max 500KB each)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addDocumentRow}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Document
                  </button>
                </div>

                <div className="space-y-4">
                  {documents.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Document {index + 1}</h4>
                        {documents.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDocumentRow(doc.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Document Category *
                          </label>
                          <select
                            required
                            value={doc.document_type_id}
                            onChange={(e) =>
                              updateDocument(doc.id, 'document_type_id', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select Document Type</option>
                            {documentTypes.map((dt) => (
                              <option key={dt.document_type_id} value={dt.document_type_id}>
                                {dt.document_type_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Document Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={doc.document_number}
                            onChange={(e) =>
                              updateDocument(doc.id, 'document_number', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valid From *
                          </label>
                          <input
                            type="date"
                            required
                            value={doc.valid_from}
                            onChange={(e) =>
                              updateDocument(doc.id, 'valid_from', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valid To *
                          </label>
                          <input
                            type="date"
                            required
                            value={doc.valid_to}
                            onChange={(e) => updateDocument(doc.id, 'valid_to', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Remarks *
                          </label>
                          <input
                            type="text"
                            required
                            value={doc.remarks}
                            onChange={(e) => updateDocument(doc.id, 'remarks', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Document *
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-white bg-white">
                                <Upload className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600 truncate">
                                  {doc.file ? doc.file.name : 'Choose file'}
                                </span>
                              </div>
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) =>
                                  handleFileChange(doc.id, e.target.files?.[0] || null)
                                }
                                className="hidden"
                              />
                            </label>
                            {doc.file && (
                              <button
                                type="button"
                                onClick={() => handleFileChange(doc.id, null)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                  {saving ? 'Saving...' : editingVehicle ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">Vehicle Details</h2>
              <button onClick={() => setShowViewModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Vehicle Number</h3>
                  <p className="text-lg font-medium text-gray-900">{viewingVehicle.vehicle_number}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Vehicle Type</h3>
                  <p className="text-lg font-medium text-gray-900">{viewingVehicle.vehicle_type}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Vehicle Category</h3>
                  <p className="text-lg font-medium text-gray-900">{(viewingVehicle as any).vehicle_category || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Ownership Type</h3>
                  <p className="text-lg font-medium text-gray-900">{viewingVehicle.ownership_type}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Status</h3>
                  <p className="text-lg font-medium text-gray-900">{viewingVehicle.status}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Make / Model</h3>
                  <p className="text-lg font-medium text-gray-900">
                    {viewingVehicle.make} {viewingVehicle.model}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Year of Manufacture</h3>
                  <p className="text-lg font-medium text-gray-900">{viewingVehicle.year_of_manufacture}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Capacity</h3>
                  <p className="text-lg font-medium text-gray-900">{viewingVehicle.capacity_tons} TON</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Registration Number</h3>
                  <p className="text-lg font-medium text-gray-900">{viewingVehicle.registration_number || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Engine Number</h3>
                  <p className="text-lg font-medium text-gray-900">{viewingVehicle.engine_number}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Chassis Number</h3>
                  <p className="text-lg font-medium text-gray-900">{viewingVehicle.chassis_number}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Odometer Reading</h3>
                  <p className="text-lg font-medium text-gray-900">{viewingVehicle.odometer_current} km</p>
                </div>

                {viewingVehicle.ownership_type === 'Owned' && (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">Fuel Cost - Reefer (per KM)</h3>
                      <p className="text-lg font-medium text-gray-900">₹{(viewingVehicle as any).standard_fuel_cost_reefer || 'N/A'}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">Fuel Cost - Dry (per KM)</h3>
                      <p className="text-lg font-medium text-gray-900">₹{(viewingVehicle as any).standard_fuel_cost_dry || 'N/A'}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">Fuel Cost - Empty (per KM)</h3>
                      <p className="text-lg font-medium text-gray-900">₹{(viewingVehicle as any).standard_fuel_cost_empty || 'N/A'}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">EMI per Month</h3>
                      <p className="text-lg font-medium text-gray-900">₹{((viewingVehicle as any).emi_per_month || viewingVehicle.fixed_cost_per_month || 0).toLocaleString()}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">Fast Tag</h3>
                      <p className="text-lg font-medium text-gray-900">
                        {fastTags.find((ft) => ft.fast_tag_id === (viewingVehicle as any).fast_tag_id)?.vehicle_number || 'N/A'}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">Diesel Card</h3>
                      <p className="text-lg font-medium text-gray-900">
                        {dieselCards.find((dc) => dc.diesel_card_id === viewingVehicle.diesel_card_id)?.card_name || 'N/A'}
                      </p>
                    </div>
                  </>
                )}

                {viewingVehicle.remarks && (
                  <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Remarks</h3>
                    <p className="text-lg font-medium text-gray-900">{viewingVehicle.remarks}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Documents</h3>
                {loadingDocuments ? (
                  <div className="text-center py-8 text-gray-500">Loading documents...</div>
                ) : vehicleDocuments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No documents found</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicleDocuments.map((doc) => (
                      <div
                        key={doc.document_id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {doc.document_types?.document_type_name || 'Document'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Doc #: {doc.document_number}
                            </p>
                          </div>
                        </div>

                        <div
                          className="relative mb-3 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group h-32 flex items-center justify-center"
                          onClick={() => handleDocumentPreview(doc)}
                        >
                          {doc.file_type.startsWith('image/') ? (
                            <DocumentThumbnail doc={doc} />
                          ) : (
                            <div className="flex flex-col items-center">
                              <FileText className="w-12 h-12 text-gray-400" />
                              <p className="text-xs text-gray-500 mt-2">PDF Document</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        <div className="text-xs text-gray-600 space-y-1 mb-3">
                          <p>
                            Valid: {new Date(doc.valid_from).toLocaleDateString()} - {new Date(doc.valid_to).toLocaleDateString()}
                          </p>
                          {doc.remarks && <p>Remarks: {doc.remarks}</p>}
                        </div>

                        <button
                          onClick={() => handleDocumentDownload(doc)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {documentPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{documentPreview.name}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={documentPreview.url}
                  download={documentPreview.name}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => setDocumentPreview(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {documentPreview.type.startsWith('image/') ? (
                <img
                  src={documentPreview.url}
                  alt={documentPreview.name}
                  className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                />
              ) : (
                <iframe
                  src={documentPreview.url}
                  className="w-full h-full min-h-[600px] rounded-lg"
                  title={documentPreview.name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentThumbnail({ doc }: { doc: StoredVehicleDocument }) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    async function loadThumbnail() {
      const { data } = await supabase.storage
        .from('vehicle-documents')
        .createSignedUrl(doc.attachment_url, 3600);
      if (data?.signedUrl) {
        setUrl(data.signedUrl);
      }
    }
    loadThumbnail();
  }, [doc.attachment_url]);

  if (!url) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <img
      src={url}
      alt={doc.file_name}
      className="w-full h-full object-cover"
    />
  );
}
