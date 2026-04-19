import { useEffect, useState, useRef } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, X, Upload, Eye, Download, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { downloadCSV, parseCSV, readFileAsText } from '../lib/csv-utils';

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

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

interface VehicleCategory {
  category_id: string;
  category_name: string;
  description: string | null;
}

interface Vehicle {
  vehicle_id: string;
  vehicle_number: string;
  vehicle_type: string;
  vehicle_type_id: string | null;
  vehicle_category?: string | null;
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
  fast_tag_id?: string | null;
  diesel_card_id: string | null;
  standard_fuel_cost_reefer?: number;
  standard_fuel_cost_dry?: number;
  standard_fuel_cost_empty?: number;
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
  uploadedUrl?: string;
  uploading?: boolean;
}

interface StoredVehicleDocument {
  vehicle_document_id: string;
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
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingDocuments, setExistingDocuments] = useState<StoredVehicleDocument[]>([]);
  const [loadingExistingDocs, setLoadingExistingDocs] = useState(false);
  const [replacingDocuments, setReplacingDocuments] = useState<{[key: string]: File | null}>({});
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupReport, setCleanupReport] = useState<any>(null);
  const [cleaningUp, setCleaningUp] = useState(false);
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
    fixed_cost_per_month: 0,
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
        loadVehicleCategories(),
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

  async function loadVehicleCategories() {
    const { data, error } = await supabase
      .from('vehicle_categories_master')
      .select('*')
      .eq('is_active', true)
      .order('category_name');

    if (error) throw error;
    setVehicleCategories(data || []);
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

  function closeDocumentPreview() {
    if (documentPreview?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(documentPreview.url);
    }
    setDocumentPreview(null);
  }

  async function handleDocumentPreview(doc: StoredVehicleDocument) {
    try {
      const { data, error } = await supabase.storage
        .from('vehicle-documents')
        .download(doc.attachment_url);
      if (error) throw error;
      if (data) {
        const mimeType = doc.file_type && doc.file_type !== 'application/octet-stream'
          ? doc.file_type
          : getMimeType(doc.file_name);
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setDocumentPreview({ url, type: mimeType, name: doc.file_name });
      }
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Failed to load document');
    }
  }

  async function handleDocumentDownload(doc: StoredVehicleDocument) {
    try {
      const { data, error } = await supabase.storage
        .from('vehicle-documents')
        .download(doc.attachment_url);
      if (error) throw error;
      if (data) {
        const mimeType = doc.file_type && doc.file_type !== 'application/octet-stream'
          ? doc.file_type
          : getMimeType(doc.file_name);
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
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
    setDocuments(prev => [
      ...prev,
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
    if (!editingVehicle && documents.length === 1) {
      alert('At least one document row is required when adding a new vehicle');
      return;
    }
    setDocuments(prev => prev.filter((doc) => doc.id !== id));
  }

  function clearDocumentRow(id: string) {
    setDocuments(prev =>
      prev.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              document_type_id: '',
              document_number: '',
              valid_from: '',
              valid_to: '',
              remarks: '',
              file: null,
            }
          : doc
      )
    );
  }

  function updateDocument(id: string, field: keyof VehicleDocument, value: any) {
    if (field === 'document_type_id' && value) {
      const alreadySelectedInNew = documents.some(
        (doc) => doc.id !== id && doc.document_type_id === value
      );

      const alreadyExistsInVehicle = editingVehicle && existingDocuments.some(
        (doc) => doc.document_type_id === value
      );

      if (alreadySelectedInNew) {
        alert('This document category is already selected. Only one document per category is allowed.');
        return;
      }

      if (alreadyExistsInVehicle) {
        const confirmReplace = confirm(
          'This document category already exists for this vehicle. Adding a new document here will create a duplicate. Please use the "Replace Document" option in the Existing Documents section instead.'
        );
        if (!confirmReplace) {
          return;
        }
      }
    }

    setDocuments(prev =>
      prev.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc))
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

    setDocuments(prev =>
      prev.map(doc =>
        doc.id === id
          ? { ...doc, file: file, uploadedUrl: file ? undefined : doc.uploadedUrl }
          : doc
      )
    );
  }

  async function uploadDocumentImmediately(docId: string) {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !doc.file) {
      alert('Please select a file first');
      return;
    }

    if (!doc.document_type_id) {
      alert('Please select Document Category first');
      return;
    }
    if (!doc.document_number) {
      alert('Please enter Document Number first');
      return;
    }
    if (!doc.valid_from) {
      alert('Please enter Valid From date first');
      return;
    }
    if (!doc.valid_to) {
      alert('Please enter Valid To date first');
      return;
    }
    if (!doc.remarks) {
      alert('Please enter Remarks first');
      return;
    }

    updateDocument(docId, 'uploading', true);

    try {
      const fileExt = doc.file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `vehicle-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(filePath, doc.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: doc.file.type || getMimeType(doc.file.name),
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-documents')
        .getPublicUrl(filePath);

      updateDocument(docId, 'uploadedUrl', publicUrl);
      alert('✅ Document uploaded successfully! You can now see it below.');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      updateDocument(docId, 'uploading', false);
    }
  }

  async function loadExistingDocuments(vehicleId: string) {
    setLoadingExistingDocs(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_documents')
        .select('*, document_types(document_type_name)')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Loaded documents for vehicle:', vehicleId, 'Count:', data?.length || 0);
      setExistingDocuments(data || []);
    } catch (error) {
      console.error('Error loading existing documents:', error);
    } finally {
      setLoadingExistingDocs(false);
    }
  }

  async function handleCleanupDuplicates() {
    if (!confirm('This will remove all duplicate documents, keeping only the most recent one for each category. Continue?')) {
      return;
    }

    setCleaningUp(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cleanup-duplicate-documents`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers
      });

      if (!response.ok) throw new Error('Failed to cleanup duplicates');

      const result = await response.json();
      setCleanupReport(result.report);
      setShowCleanupModal(true);

      if (editingVehicle) {
        await loadExistingDocuments(editingVehicle.vehicle_id);
      }
    } catch (error: any) {
      console.error('Error cleaning up duplicates:', error);
      alert('Failed to cleanup duplicates: ' + error.message);
    } finally {
      setCleaningUp(false);
    }
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
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${vehicleId}/${documentNumber.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;

      console.log('Uploading document:', { vehicleId, documentTypeId, documentNumber, fileName });

      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || getMimeType(file.name),
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

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

      if (docError) {
        console.error('Database insert error:', docError);
        throw new Error(`Failed to save document record: ${docError.message}`);
      }

      console.log('Document uploaded successfully:', fileName);
    } catch (error) {
      console.error('Upload document error:', error);
      throw error;
    }
  }

  async function replaceDocument(
    existingDocId: string,
    vehicleId: string,
    documentTypeId: string,
    documentNumber: string,
    validFrom: string,
    validTo: string,
    remarks: string,
    file: File,
    oldAttachmentUrl: string
  ) {
    if (!confirm(`Are you sure you want to replace this document? The old file will be permanently deleted.`)) {
      const newReplacingDocs = { ...replacingDocuments };
      delete newReplacingDocs[existingDocId];
      setReplacingDocuments(newReplacingDocs);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${vehicleId}/${documentNumber.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('vehicle-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || getMimeType(file.name),
      });

    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase
      .from('vehicle_documents')
      .update({
        document_number: documentNumber,
        valid_from: validFrom || null,
        valid_to: validTo || null,
        remarks: remarks,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        attachment_url: fileName,
      })
      .eq('vehicle_document_id', existingDocId);

    if (updateError) throw updateError;

    if (oldAttachmentUrl) {
      await supabase.storage.from('vehicle-documents').remove([oldAttachmentUrl]);
    }
  }

  async function deleteDocument(documentId: string, attachmentUrl: string) {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('vehicle_documents')
        .delete()
        .eq('vehicle_document_id', documentId);

      if (deleteError) throw deleteError;

      if (attachmentUrl) {
        await supabase.storage.from('vehicle-documents').remove([attachmentUrl]);
      }

      alert('Document deleted successfully!');
      if (editingVehicle) {
        await loadExistingDocuments(editingVehicle.vehicle_id);
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document: ' + error.message);
    }
  }

  async function viewDocument(attachmentUrl: string, fileName: string) {
    try {
      const { data, error } = await supabase.storage
        .from('vehicle-documents')
        .createSignedUrl(attachmentUrl, 3600);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Error viewing document:', error);
      alert('Failed to view document: ' + error.message);
    }
  }

  async function downloadDocument(attachmentUrl: string, fileName: string) {
    try {
      const { data, error } = await supabase.storage
        .from('vehicle-documents')
        .download(attachmentUrl);

      if (error) throw error;
      if (data) {
        const mimeType = getMimeType(fileName);
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error('Error downloading document:', error);
      alert('Failed to download document: ' + error.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (!editingVehicle) {
        const hasValidDocuments = documents.some(doc =>
          doc.document_type_id && doc.document_number && doc.valid_from &&
          doc.valid_to && doc.remarks && doc.file
        );

        if (!hasValidDocuments) {
          alert('At least one complete document is required when adding a new vehicle.');
          setSaving(false);
          return;
        }

        for (const doc of documents) {
          if (doc.document_type_id || doc.document_number || doc.valid_from ||
              doc.valid_to || doc.remarks || doc.file) {
            if (!doc.document_type_id) {
              alert('Document Type is required for all documents.');
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
        }
      } else {
        const docsWithData = documents.filter(doc =>
          doc.document_type_id || doc.document_number || doc.valid_from || doc.valid_to || doc.remarks || doc.file
        );

        for (const doc of docsWithData) {
          if (!doc.uploadedUrl) {
            if (doc.file) {
              alert('⚠️ You selected a file but did not click "Upload Document" button. Please upload the document first.');
            } else {
              alert('⚠️ You filled in document details but did not upload a document. Please select a file and click "Upload Document".');
            }
            setSaving(false);
            return;
          }
        }
      }

      const vehicleData = {
        ...formData,
        vehicle_type_id: formData.vehicle_type_id || null,
        diesel_card_id: formData.diesel_card_id || null,
        fast_tag_id: formData.fast_tag_id || null,
      };

      let vehicleId: string;

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('vehicle_id', editingVehicle.vehicle_id);

        if (error) throw error;
        vehicleId = editingVehicle.vehicle_id;

        for (const [docId, file] of Object.entries(replacingDocuments)) {
          if (file) {
            const existingDoc = existingDocuments.find(d => d.vehicle_document_id === docId);
            if (existingDoc) {
              await replaceDocument(
                docId,
                vehicleId,
                existingDoc.document_type_id,
                existingDoc.document_number,
                existingDoc.valid_from || '',
                existingDoc.valid_to || '',
                existingDoc.remarks,
                file,
                existingDoc.attachment_url
              );
            }
          }
        }
      } else {
        const { data, error } = await supabase
          .from('vehicles')
          .insert(vehicleData)
          .select()
          .single();

        if (error) throw error;
        vehicleId = data.vehicle_id;
      }

      let uploadedCount = 0;
      for (const doc of documents) {
        if (doc.uploadedUrl && doc.document_type_id) {
          const { error: dbError } = await supabase
            .from('vehicle_documents')
            .insert({
              vehicle_id: vehicleId,
              document_type_id: doc.document_type_id,
              document_number: doc.document_number,
              valid_from: doc.valid_from,
              valid_to: doc.valid_to,
              remarks: doc.remarks,
              attachment_url: doc.uploadedUrl,
              file_name: doc.file?.name || 'unknown',
              file_size: doc.file?.size || 0,
              file_type: doc.file?.type || 'application/octet-stream',
            });

          if (dbError) throw dbError;
          uploadedCount++;
        }
      }

      const successMsg = editingVehicle
        ? `Vehicle updated successfully!${uploadedCount > 0 ? ` ${uploadedCount} document(s) uploaded.` : ''}`
        : `Vehicle created successfully!${uploadedCount > 0 ? ` ${uploadedCount} document(s) uploaded.` : ''}`;

      alert(successMsg);
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

  async function openEditModal(vehicle: Vehicle) {
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
      fixed_cost_per_month: vehicle.fixed_cost_per_month || 0,
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
    setReplacingDocuments({});
    await loadExistingDocuments(vehicle.vehicle_id);
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
      fixed_cost_per_month: 0,
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
    setExistingDocuments([]);
    setReplacingDocuments({});
  }

  async function handleDownloadTemplate() {
    const template = [
      {
        vehicle_number: 'KA01AB1234',
        vehicle_type_name: '32 Feet Reefer',
        vehicle_category: 'Reefer',
        ownership_type: 'Owned',
        make: 'TATA',
        model: 'LPT 3118',
        year_of_manufacture: 2020,
        capacity_tons: 16,
        registration_number: 'KA01AB1234',
        engine_number: 'ENG123456',
        chassis_number: 'CHS123456',
        odometer_current: 50000,
        diesel_card_number: 'DC001',
        fast_tag_wallet_id: 'FT001',
        standard_fuel_cost_reefer: 12.5,
        standard_fuel_cost_dry: 10.0,
        standard_fuel_cost_empty: 8.0,
        vehicle_status: 'Active',
        fixed_cost_per_month: 25000,
        remarks: 'Sample vehicle entry',
      },
    ];

    downloadCSV(template, 'vehicle_import_template');
  }

  async function handleUploadTemplate() {
    fileInputRef.current?.click();
  }

  async function handleCsvImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setUploading(true);

    try {
      const text = await readFileAsText(file);
      const rows = parseCSV(text);

      if (rows.length === 0) {
        alert('No data found in the file');
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of rows) {
        try {
          let vehicleTypeId = null;
          if (row.vehicle_type_name) {
            const vehicleType = vehicleTypes.find(
              (vt) => vt.vehicle_type_name.toLowerCase() === row.vehicle_type_name.toLowerCase()
            );
            vehicleTypeId = vehicleType?.vehicle_type_id || null;
          }

          let dieselCardId = null;
          if (row.diesel_card_number) {
            const dieselCard = dieselCards.find(
              (dc) => dc.card_number === row.diesel_card_number
            );
            dieselCardId = dieselCard?.diesel_card_id || null;
          }

          let fastTagId = null;
          if (row.fast_tag_wallet_id) {
            const fastTag = fastTags.find(
              (ft) => ft.wallet_id === row.fast_tag_wallet_id
            );
            fastTagId = fastTag?.fast_tag_id || null;
          }

          const vehicleData = {
            vehicle_number: row.vehicle_number,
            vehicle_type_id: vehicleTypeId,
            vehicle_category: row.vehicle_category || null,
            ownership_type: row.ownership_type || 'Owned',
            make: row.make || '',
            model: row.model || '',
            year_of_manufacture: row.year_of_manufacture ? parseInt(row.year_of_manufacture) : null,
            capacity_tons: row.capacity_tons ? parseFloat(row.capacity_tons) : 0,
            registration_number: row.registration_number || '',
            engine_number: row.engine_number || '',
            chassis_number: row.chassis_number || '',
            odometer_current: row.odometer_current ? parseFloat(row.odometer_current) : 0,
            diesel_card_id: dieselCardId,
            fast_tag_id: fastTagId,
            standard_fuel_cost_reefer: row.standard_fuel_cost_reefer
              ? parseFloat(row.standard_fuel_cost_reefer)
              : 0,
            standard_fuel_cost_dry: row.standard_fuel_cost_dry
              ? parseFloat(row.standard_fuel_cost_dry)
              : 0,
            standard_fuel_cost_empty: row.standard_fuel_cost_empty
              ? parseFloat(row.standard_fuel_cost_empty)
              : 0,
            vehicle_status: row.vehicle_status || 'Active',
            status: row.vehicle_status || 'Active',
            fixed_cost_per_month: row.fixed_cost_per_month
              ? parseFloat(row.fixed_cost_per_month)
              : 0,
            remarks: row.remarks || '',
          };

          const { error } = await supabase.from('vehicles').insert([vehicleData]);

          if (error) {
            errorCount++;
            errors.push(`Row ${successCount + errorCount + 1}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (error: any) {
          errorCount++;
          errors.push(`Row ${successCount + errorCount + 1}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        await loadVehicles();
      }

      let message = `Import completed!\n${successCount} vehicles imported successfully`;
      if (errorCount > 0) {
        message += `\n${errorCount} failed`;
        if (errors.length > 0) {
          message += `\n\nFirst few errors:\n${errors.slice(0, 5).join('\n')}`;
        }
      }
      alert(message);
    } catch (error: any) {
      console.error('Error importing vehicles:', error);
      alert('Error importing file: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDownloadVehicleMaster() {
    if (vehicles.length === 0) {
      alert('No vehicles to export');
      return;
    }

    const exportData = vehicles.map((vehicle) => {
      const vehicleType = vehicleTypes.find((vt) => vt.vehicle_type_id === vehicle.vehicle_type_id);
      const dieselCard = dieselCards.find((dc) => dc.diesel_card_id === vehicle.diesel_card_id);
      const fastTag = fastTags.find((ft) => ft.fast_tag_id === vehicle.fast_tag_id);

      return {
        vehicle_number: vehicle.vehicle_number,
        vehicle_type_name: vehicleType?.vehicle_type_name || vehicle.vehicle_type || '',
        vehicle_category: vehicle.vehicle_category || '',
        ownership_type: vehicle.ownership_type,
        make: vehicle.make,
        model: vehicle.model,
        year_of_manufacture: vehicle.year_of_manufacture || '',
        capacity_tons: vehicle.capacity_tons,
        registration_number: vehicle.registration_number,
        engine_number: vehicle.engine_number,
        chassis_number: vehicle.chassis_number,
        odometer_current: vehicle.odometer_current,
        diesel_card_number: dieselCard?.card_number || '',
        fast_tag_wallet_id: fastTag?.wallet_id || '',
        standard_fuel_cost_reefer: vehicle.standard_fuel_cost_reefer,
        standard_fuel_cost_dry: vehicle.standard_fuel_cost_dry,
        standard_fuel_cost_empty: vehicle.standard_fuel_cost_empty,
        vehicle_status: vehicle.vehicle_status,
        fixed_cost_per_month: vehicle.fixed_cost_per_month,
        remarks: vehicle.remarks,
      };
    });

    downloadCSV(exportData, `vehicle_master_${new Date().toISOString().split('T')[0]}`);
  }

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4">
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

          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              <FileText className="w-4 h-4" />
              Download Template
            </button>
            <button
              onClick={handleUploadTemplate}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm disabled:bg-orange-400 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Template'}
            </button>
            <button
              onClick={handleDownloadVehicleMaster}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download Vehicle Master
            </button>
            <button
              onClick={handleCleanupDuplicates}
              disabled={cleaningUp}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {cleaningUp ? 'Cleaning...' : 'Cleanup Duplicate Documents'}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleCsvImport}
        className="hidden"
      />

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
                    {vehicleCategories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_name}>
                        {cat.category_name}
                      </option>
                    ))}
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
                        value={formData.fixed_cost_per_month}
                        onChange={(e) => setFormData({ ...formData, fixed_cost_per_month: parseFloat(e.target.value) || 0 })}
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
                    <h3 className="text-lg font-semibold text-gray-900">
                      Vehicle Documents {!editingVehicle && '*'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {editingVehicle
                        ? 'Upload new documents or replace existing ones (Optional - JPG, JPEG, PNG, PDF - Max 500KB each)'
                        : 'At least one document is required (JPG, JPEG, PNG, PDF - Max 500KB each)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addDocumentRow}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Document
                  </button>
                </div>

                {editingVehicle && existingDocuments.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Existing Documents</h4>
                    {loadingExistingDocs ? (
                      <div className="text-center py-4 text-gray-500">Loading existing documents...</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {existingDocuments.map((doc) => (
                          <div
                            key={doc.vehicle_document_id}
                            className="border border-gray-200 rounded-lg p-4 bg-white"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900">
                                  {doc.document_types?.document_type_name || 'Document'}
                                </h5>
                                <p className="text-sm text-gray-600">Doc #: {doc.document_number}</p>
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Existing
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1 mb-3">
                              <p>Valid: {new Date(doc.valid_from || '').toLocaleDateString()} - {new Date(doc.valid_to || '').toLocaleDateString()}</p>
                              <p>File: {doc.file_name} ({(doc.file_size / 1024).toFixed(1)} KB)</p>
                              {doc.remarks && <p>Remarks: {doc.remarks}</p>}
                              <p className="text-gray-500">Uploaded: {new Date(doc.created_at || '').toLocaleString()}</p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => viewDocument(doc.attachment_url, doc.file_name)}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg transition-colors"
                                  title="View document"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm text-gray-700">View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadDocument(doc.attachment_url, doc.file_name)}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg transition-colors"
                                  title="Download document"
                                >
                                  <Download className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm text-gray-700">Download</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <label className="flex-1 cursor-pointer">
                                  <div className="flex items-center justify-center gap-2 px-3 py-2 border border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                    <Upload className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-blue-700">
                                      {replacingDocuments[doc.vehicle_document_id]
                                        ? 'File Selected'
                                        : 'Replace'}
                                    </span>
                                  </div>
                                  <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
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
                                        setReplacingDocuments({
                                          ...replacingDocuments,
                                          [doc.vehicle_document_id]: file,
                                        });
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => deleteDocument(doc.vehicle_document_id, doc.attachment_url)}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Delete document"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                  <span className="text-sm text-red-700">Delete</span>
                                </button>
                              </div>

                              {replacingDocuments[doc.vehicle_document_id] && (
                                <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded">
                                  <span className="text-xs text-green-700">
                                    New file: {replacingDocuments[doc.vehicle_document_id]?.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newReplacingDocs = { ...replacingDocuments };
                                      delete newReplacingDocs[doc.vehicle_document_id];
                                      setReplacingDocuments(newReplacingDocs);
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                    title="Cancel replacement"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    {editingVehicle ? 'Add New Documents' : 'Documents to Upload'}
                  </h4>
                  {editingVehicle && (
                    <p className="text-sm text-gray-500 italic">
                      Optional - Leave all fields empty if not adding documents
                    </p>
                  )}
                  {documents.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">New Document {index + 1}</h5>
                        <div className="flex gap-2">
                          {editingVehicle && (
                            <button
                              type="button"
                              onClick={() => clearDocumentRow(doc.id)}
                              className="text-sm text-gray-600 hover:text-gray-800 underline"
                            >
                              Clear All
                            </button>
                          )}
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
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Document Category {!editingVehicle && '*'}
                          </label>
                          <select
                            value={doc.document_type_id}
                            onChange={(e) =>
                              updateDocument(doc.id, 'document_type_id', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select Document Type</option>
                            {documentTypes.map((dt) => {
                              const isUsedInExisting = existingDocuments.some(
                                (existingDoc) => existingDoc.document_type_id === dt.document_type_id
                              );
                              const isUsedInNew = documents.some(
                                (newDoc) => newDoc.id !== doc.id && newDoc.document_type_id === dt.document_type_id
                              );
                              const isDisabled = isUsedInNew;

                              return (
                                <option
                                  key={dt.document_type_id}
                                  value={dt.document_type_id}
                                  disabled={isDisabled}
                                >
                                  {dt.document_type_name}
                                  {isUsedInExisting ? ' (Already exists - use Replace)' : ''}
                                  {isUsedInNew ? ' (Already selected)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Document Number {!editingVehicle && '*'}
                          </label>
                          <input
                            type="text"
                            value={doc.document_number}
                            onChange={(e) =>
                              updateDocument(doc.id, 'document_number', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valid From {!editingVehicle && '*'}
                          </label>
                          <input
                            type="date"
                            value={doc.valid_from}
                            onChange={(e) =>
                              updateDocument(doc.id, 'valid_from', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valid To {!editingVehicle && '*'}
                          </label>
                          <input
                            type="date"
                            value={doc.valid_to}
                            onChange={(e) => updateDocument(doc.id, 'valid_to', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Remarks {!editingVehicle && '*'}
                          </label>
                          <input
                            type="text"
                            value={doc.remarks}
                            onChange={(e) => updateDocument(doc.id, 'remarks', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Document {!editingVehicle && '*'}
                          </label>
                          <label className={`block cursor-pointer ${doc.uploadedUrl ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                              doc.file
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                            }`}>
                              <FileText className={`w-5 h-5 ${doc.file ? 'text-blue-600' : 'text-gray-500'}`} />
                              <span className={`text-sm font-medium ${
                                doc.file ? 'text-blue-700' : 'text-gray-600'
                              }`}>
                                {doc.file ? 'File Selected ✓' : 'Click to Choose File'}
                              </span>
                            </div>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => {
                                handleFileChange(doc.id, e.target.files?.[0] || null);
                              }}
                              className="hidden"
                              disabled={!!doc.uploadedUrl}
                            />
                          </label>
                        </div>

                        <div className="col-span-3">
                          {doc.file && (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-blue-900 truncate">{doc.file.name}</p>
                                  <p className="text-xs text-blue-600">
                                    {(doc.file.size / 1024).toFixed(1)} KB • Ready to upload
                                  </p>
                                </div>
                                {!doc.uploadedUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleFileChange(doc.id, null)}
                                    className="text-red-600 hover:bg-red-100 p-1.5 rounded"
                                    title="Remove file"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {!doc.uploadedUrl ? (
                            <button
                              type="button"
                              onClick={() => uploadDocumentImmediately(doc.id)}
                              disabled={!doc.file || doc.uploading}
                              className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                                doc.file && !doc.uploading
                                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {doc.uploading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-5 h-5" />
                                  {doc.file ? 'Upload Document Now' : 'Select a file first'}
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="border-2 border-green-500 bg-green-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-green-700">Document Uploaded Successfully!</p>
                                    <p className="text-xs text-green-600">{doc.file?.name}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateDocument(doc.id, 'uploadedUrl', undefined);
                                    updateDocument(doc.id, 'file', null);
                                  }}
                                  className="text-red-600 hover:bg-red-100 p-2 rounded"
                                  title="Remove and re-upload"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex gap-2">
                                <a
                                  href={doc.uploadedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 bg-white text-green-700 border border-green-500 py-2 px-3 rounded text-sm font-medium hover:bg-green-100 flex items-center justify-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Document
                                </a>
                                <a
                                  href={doc.uploadedUrl}
                                  download
                                  className="flex-1 bg-white text-green-700 border border-green-500 py-2 px-3 rounded text-sm font-medium hover:bg-green-100 flex items-center justify-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </a>
                              </div>
                            </div>
                          )}
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
                      <p className="text-lg font-medium text-gray-900">₹{(viewingVehicle.fixed_cost_per_month || 0).toLocaleString()}</p>
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
                        key={doc.vehicle_document_id}
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
                  onClick={closeDocumentPreview}
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

      {showCleanupModal && cleanupReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">Duplicate Cleanup Report</h2>
              <button onClick={() => setShowCleanupModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-600 mb-1">Vehicles Affected</h3>
                  <p className="text-2xl font-bold text-blue-900">{cleanupReport.vehiclesAffected}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-red-600 mb-1">Documents Deleted</h3>
                  <p className="text-2xl font-bold text-red-900">{cleanupReport.totalDocumentsDeleted}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-600 mb-1">Cleanup Time</h3>
                  <p className="text-sm font-medium text-green-900">
                    {new Date(cleanupReport.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {cleanupReport.deletionDetails.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Deletion Details</h3>
                  <div className="space-y-4">
                    {cleanupReport.deletionDetails.map((detail: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {detail.vehicleNumber}
                            </h4>
                            <p className="text-sm text-gray-600">Vehicle ID: {detail.vehicleId}</p>
                          </div>
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            {detail.documentsDeleted} deleted
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-700">
                            <span className="font-medium">Category:</span> {detail.documentCategory}
                          </p>
                          <p className="text-green-700">
                            <span className="font-medium">Kept Document:</span> {detail.keptDocumentId}
                          </p>
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Deleted Files:</p>
                            <ul className="list-disc list-inside text-gray-600 space-y-1">
                              {detail.deletedFiles.map((file: string, i: number) => (
                                <li key={i} className="truncate">{file}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cleanupReport.totalDocumentsDeleted === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No duplicate documents were found in the system.
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button
                onClick={() => setShowCleanupModal(false)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Close Report
              </button>
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
