import { useEffect, useState } from 'react';
import { Plus, Search, Eye, CreditCard as Edit, X, Trash2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { CityAutocomplete } from '../components/CityAutocomplete';

interface Enquiry {
  enquiry_id: string;
  enquiry_number: string;
  enquiry_date: string;
  customer_id: string | null;
  contact_person: string;
  contact_mobile: string;
  contact_email: string;
  origin: string;
  destination: string;
  material_description: string;
  weight_tons: number;
  vehicle_type_required: string;
  load_type: string;
  loading_date: string | null;
  quoted_rate: number;
  remarks: string;
  status: string;
  converted_to_trip_id: string | null;
  customer?: { customer_name: string };
}

interface EnquiriesListProps {
  autoOpenCreate?: boolean;
  onNavigate?: (page: string, options?: { convertEnquiry?: any }) => void;
}

export function EnquiriesList({ autoOpenCreate = false, onNavigate }: EnquiriesListProps) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<Array<{ vehicle_type_id: string; vehicle_type_name: string; capacity_tons: number; vehicle_category: string | null }>>([]);
  const [loadTypes, setLoadTypes] = useState<Array<{ load_type_id: string; load_type_name: string; description: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | 'all'>('7days');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const { hasPermission } = useAuth();

  const canEdit = hasPermission('trips') || hasPermission('all');

  useEffect(() => {
    loadEnquiries();
    loadCustomers();
    loadVehicleTypes();
    loadLoadTypes();
  }, [dateFilter]);

  useEffect(() => {
    if (autoOpenCreate && canEdit) {
      openCreateModal();
    }
  }, [autoOpenCreate, canEdit]);

  async function loadEnquiries() {
    try {
      let query = supabase
        .from('enquiries')
        .select(`
          *,
          customer:customers(customer_name),
          converted_to_trip_id
        `);

      if (dateFilter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.gte('enquiry_date', sevenDaysAgo.toISOString());
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('enquiry_date', thirtyDaysAgo.toISOString());
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setEnquiries(data || []);
    } catch (error) {
      console.error('Error loading enquiries:', error);
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

  async function loadVehicleTypes() {
    try {
      const { data, error } = await supabase
        .from('vehicle_types_master')
        .select('vehicle_type_id, vehicle_type_name, capacity_tons, vehicle_category')
        .eq('is_active', true)
        .order('vehicle_type_name');

      if (error) throw error;
      setVehicleTypes(data || []);
    } catch (error) {
      console.error('Error loading vehicle types:', error);
    }
  }

  async function loadLoadTypes() {
    try {
      const { data, error } = await supabase
        .from('load_types_master')
        .select('load_type_id, load_type_name, description')
        .eq('is_active', true)
        .order('load_type_name');

      if (error) throw error;
      setLoadTypes(data || []);
    } catch (error) {
      console.error('Error loading load types:', error);
    }
  }

  function openCreateModal() {
    setModalMode('create');
    setSelectedEnquiry(null);
    setShowModal(true);
  }

  function openViewModal(enquiry: Enquiry) {
    setModalMode('view');
    setSelectedEnquiry(enquiry);
    setShowModal(true);
  }

  function openEditModal(enquiry: Enquiry) {
    setModalMode('edit');
    setSelectedEnquiry(enquiry);
    setShowModal(true);
  }

  async function handleDelete(enquiryId: string) {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;

    try {
      const { error } = await supabase
        .from('enquiries')
        .delete()
        .eq('enquiry_id', enquiryId);

      if (error) throw error;
      loadEnquiries();
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      alert('Failed to delete enquiry');
    }
  }

  function handleConvertToTrip(enquiry: Enquiry) {
    if (!onNavigate) return;
    onNavigate('trips', { convertEnquiry: enquiry });
  }

  async function handleUpdateTrip(enquiry: Enquiry) {
    if (!onNavigate || !enquiry.converted_to_trip_id) return;

    try {
      const { data: tripData, error } = await supabase
        .from('trips')
        .select(`
          *,
          vehicle:vehicles(vehicle_number),
          driver:drivers(driver_name),
          customer:customers(customer_name),
          route:routes(route_code)
        `)
        .eq('trip_number', enquiry.converted_to_trip_id)
        .maybeSingle();

      if (error) throw error;

      if (tripData) {
        onNavigate('trips', { editTrip: tripData });
      } else {
        alert('Trip not found');
      }
    } catch (error) {
      console.error('Error loading trip:', error);
      alert('Failed to load trip details');
    }
  }

  const filteredEnquiries = enquiries.filter((enquiry) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      enquiry.enquiry_number.toLowerCase().includes(search) ||
      enquiry.customer?.customer_name?.toLowerCase().includes(search) ||
      enquiry.origin.toLowerCase().includes(search) ||
      enquiry.destination.toLowerCase().includes(search) ||
      enquiry.status.toLowerCase().includes(search)
    );

    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Quoted':
        return 'bg-yellow-100 text-yellow-800';
      case 'Converted':
        return 'bg-green-100 text-green-800';
      case 'Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search enquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {canEdit && (
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Enquiry
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Date Range:</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as '7days' | '30days' | 'all')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="New">New</option>
                <option value="Quoted">Quoted</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Enquiry #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Quoted Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No enquiries found. Create your first enquiry to get started.
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enquiry) => (
                  <tr key={enquiry.enquiry_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {enquiry.enquiry_number}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(enquiry.enquiry_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {enquiry.customer?.customer_name || enquiry.contact_person}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {enquiry.origin} → {enquiry.destination}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(enquiry.status)}`}>
                        {enquiry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {enquiry.quoted_rate > 0 ? formatCurrency(enquiry.quoted_rate) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openViewModal(enquiry)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            {(enquiry.status === 'New' || enquiry.status === 'Quoted' || enquiry.status === 'Converted') && onNavigate && (
                              <button
                                onClick={() => !enquiry.converted_to_trip_id && handleConvertToTrip(enquiry)}
                                disabled={!!enquiry.converted_to_trip_id}
                                className={`p-1 rounded transition-colors ${
                                  enquiry.converted_to_trip_id
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                                title={enquiry.converted_to_trip_id ? `Already converted to trip ${enquiry.converted_to_trip_id}` : 'Convert to Trip'}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(enquiry)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(enquiry.enquiry_id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <EnquiryModal
          mode={modalMode}
          enquiry={selectedEnquiry}
          customers={customers}
          vehicleTypes={vehicleTypes}
          loadTypes={loadTypes}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadEnquiries();
          }}
          onUpdateTrip={handleUpdateTrip}
        />
      )}
    </div>
  );
}

interface EnquiryModalProps {
  mode: 'create' | 'view' | 'edit';
  enquiry: Enquiry | null;
  customers: any[];
  vehicleTypes: Array<{ vehicle_type_id: string; vehicle_type_name: string; capacity_tons: number; vehicle_category: string | null }>;
  loadTypes: Array<{ load_type_id: string; load_type_name: string; description: string }>;
  onClose: () => void;
  onSuccess: () => void;
  onUpdateTrip: (enquiry: Enquiry) => void;
}

function EnquiryModal({ mode, enquiry, customers, vehicleTypes, loadTypes, onClose, onSuccess, onUpdateTrip }: EnquiryModalProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    enquiry_date: enquiry?.enquiry_date || new Date().toISOString().split('T')[0],
    customer_id: enquiry?.customer_id || '',
    contact_person: enquiry?.contact_person || '',
    contact_mobile: enquiry?.contact_mobile || '',
    contact_email: enquiry?.contact_email || '',
    origin: enquiry?.origin || '',
    destination: enquiry?.destination || '',
    material_description: enquiry?.material_description || '',
    weight_tons: enquiry?.weight_tons || 0,
    vehicle_type_required: enquiry?.vehicle_type_required || '',
    load_type: enquiry?.load_type || '',
    loading_date: enquiry?.loading_date || '',
    quoted_rate: enquiry?.quoted_rate || 0,
    remarks: enquiry?.remarks || '',
    status: enquiry?.status || 'New',
  });
  const [saving, setSaving] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(enquiry?.status || 'New');

  const handleQuotedRateChange = (value: number) => {
    setFormData(prev => {
      const newData = { ...prev, quoted_rate: value };
      if (value > 0 && prev.status === 'New') {
        newData.status = 'Quoted';
      }
      return newData;
    });
  };

  const handleVehicleTypeChange = (vehicleTypeName: string) => {
    const selectedVehicle = vehicleTypes.find(vt => vt.vehicle_type_name === vehicleTypeName);
    setFormData(prev => ({
      ...prev,
      vehicle_type_required: vehicleTypeName,
      weight_tons: selectedVehicle?.capacity_tons || prev.weight_tons
    }));
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'Quoted' && formData.quoted_rate <= 0) {
      alert('Please enter a quoted rate greater than 0 before changing status to Quoted');
      return;
    }

    if (newStatus === 'Converted' && previousStatus !== 'Converted') {
      if (!confirm('Converting this enquiry to a trip will create a new trip record. Continue?')) {
        return;
      }
    }

    setFormData({ ...formData, status: newStatus });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.load_type || formData.load_type.trim() === '' || formData.load_type === 'Select Load Type') {
      alert('Please select a Load Type');
      return;
    }

    if (formData.status === 'Quoted' && formData.quoted_rate <= 0) {
      alert('Quoted Rate must be greater than 0 when status is Quoted');
      return;
    }

    setSaving(true);

    try {
      if (mode === 'create') {
        const { data: newEnquiry, error } = await supabase
          .from('enquiries')
          .insert([
            {
              ...formData,
              customer_id: formData.customer_id || null,
              loading_date: formData.loading_date || null,
              load_type: formData.load_type,
              created_by: profile?.full_name || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        if (formData.status === 'Converted' && newEnquiry) {
          const tripData = await createTripFromEnquiry(newEnquiry.enquiry_id, formData, newEnquiry.enquiry_number);
          if (tripData) {
            const { error: updateError } = await supabase
              .from('enquiries')
              .update({ converted_to_trip_id: tripData.trip_id })
              .eq('enquiry_id', newEnquiry.enquiry_id);

            if (updateError) {
              console.error('Error updating enquiry with trip ID:', updateError);
            } else {
              alert('Enquiry created and converted successfully! A new trip has been created.');
            }
          }
        }
      } else if (mode === 'edit' && enquiry) {
        const isConvertingToTrip = formData.status === 'Converted' && previousStatus !== 'Converted';

        let tripId = enquiry.converted_to_trip_id;

        if (isConvertingToTrip) {
          const tripData = await createTripFromEnquiry(enquiry.enquiry_id, formData, enquiry.enquiry_number);
          if (tripData) {
            tripId = tripData.trip_id;
          }
        }

        const { error } = await supabase
          .from('enquiries')
          .update({
            ...formData,
            customer_id: formData.customer_id || null,
            loading_date: formData.loading_date || null,
            converted_to_trip_id: tripId,
          })
          .eq('enquiry_id', enquiry.enquiry_id);
        if (error) throw error;

        if (isConvertingToTrip) {
          alert('Enquiry converted successfully! A new trip has been created.');
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving enquiry:', error);
      alert('Failed to save enquiry');
    } finally {
      setSaving(false);
    }
  }

  async function createTripFromEnquiry(enquiryId: string, enquiryData: any, enquiryNumber?: string) {
    try {
      const { data: latestTrip } = await supabase
        .from('trips')
        .select('trip_number')
        .order('trip_number', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (latestTrip && latestTrip.length > 0 && latestTrip[0].trip_number) {
        const numPart = latestTrip[0].trip_number.replace(/\D/g, '');
        nextNumber = parseInt(numPart) + 1;
      }

      const tripNumber = `TR${nextNumber.toString().padStart(5, '0')}`;

      const loadingDateTime = enquiryData.loading_date
        ? new Date(enquiryData.loading_date).toISOString()
        : new Date().toISOString();

      const { data: tripData, error } = await supabase
        .from('trips')
        .insert([
          {
            trip_number: tripNumber,
            customer_id: enquiryData.customer_id || null,
            origin: enquiryData.origin,
            destination: enquiryData.destination,
            planned_start_datetime: loadingDateTime,
            freight_revenue: enquiryData.quoted_rate || 0,
            trip_status: 'Planned',
            remarks: `Converted from Enquiry ${enquiryNumber || enquiry?.enquiry_number || ''}. ${enquiryData.remarks || ''}`,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return tripData;
    } catch (error) {
      console.error('Error creating trip from enquiry:', error);
      alert('Failed to create trip from enquiry');
      return null;
    }
  }

  const isViewMode = mode === 'view';
  const title =
    mode === 'create' ? 'Create Enquiry' : mode === 'edit' ? 'Edit Enquiry' : 'View Enquiry';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enquiry Date *
              </label>
              <input
                type="date"
                value={formData.enquiry_date}
                onChange={(e) => setFormData({ ...formData, enquiry_date: e.target.value })}
                disabled={isViewMode}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Mobile
              </label>
              <input
                type="tel"
                value={formData.contact_mobile}
                onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label>
              <CityAutocomplete
                value={formData.origin}
                onChange={(value) => setFormData({ ...formData, origin: value })}
                disabled={isViewMode}
                required
                placeholder="Search or enter origin city..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination *
              </label>
              <CityAutocomplete
                value={formData.destination}
                onChange={(value) => setFormData({ ...formData, destination: value })}
                disabled={isViewMode}
                required
                placeholder="Search or enter destination city..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type Required
              </label>
              <select
                value={formData.vehicle_type_required}
                onChange={(e) => handleVehicleTypeChange(e.target.value)}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Vehicle Type</option>
                {vehicleTypes.map((vt) => (
                  <option key={vt.vehicle_type_id} value={vt.vehicle_type_name}>
                    {vt.vehicle_type_name}
                    {vt.vehicle_category ? ` (${vt.vehicle_category})` : ''}
                    {vt.capacity_tons ? ` - ${vt.capacity_tons} tons` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Load Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.load_type}
                onChange={(e) => setFormData({ ...formData, load_type: e.target.value })}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                  !formData.load_type && !isViewMode ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Load Type</option>
                {loadTypes.map((lt) => (
                  <option key={lt.load_type_id} value={lt.load_type_name}>
                    {lt.load_type_name}
                  </option>
                ))}
              </select>
              {!formData.load_type && !isViewMode && (
                <p className="text-xs text-red-600 mt-1">
                  Load Type is required
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (Tons)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.weight_tons}
                onChange={(e) => setFormData({ ...formData, weight_tons: Number(e.target.value) })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              {formData.vehicle_type_required && (
                <p className="text-xs text-gray-500 mt-1">
                  Auto-populated from vehicle type capacity
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loading Date
              </label>
              <input
                type="date"
                value={formData.loading_date}
                onChange={(e) => setFormData({ ...formData, loading_date: e.target.value })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quoted Rate (₹) {formData.status === 'Quoted' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quoted_rate}
                onChange={(e) => handleQuotedRateChange(Number(e.target.value))}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              {formData.quoted_rate > 0 && formData.status === 'New' && (
                <p className="text-xs text-blue-600 mt-1">
                  Status will be automatically set to "Quoted"
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="New">New</option>
                <option value="Quoted">Quoted</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
              {formData.status === 'Quoted' && formData.quoted_rate <= 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Quoted Rate is required when status is Quoted
                </p>
              )}
              {formData.status === 'Converted' && mode === 'edit' && previousStatus !== 'Converted' && (
                <p className="text-xs text-green-600 mt-1">
                  This enquiry will be converted to a trip
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Description
              </label>
              <textarea
                value={formData.material_description}
                onChange={(e) =>
                  setFormData({ ...formData, material_description: e.target.value })
                }
                disabled={isViewMode}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                disabled={isViewMode}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div>
              {enquiry?.converted_to_trip_id && (
                <button
                  type="button"
                  onClick={() => enquiry && onUpdateTrip(enquiry)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Update Trip
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isViewMode ? 'Close' : 'Cancel'}
              </button>
              {!isViewMode && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-400"
                >
                  {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
