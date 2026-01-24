import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function VehicleDocumentsList() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const { data, error } = await supabase
        .from('document_expiry_alerts_view')
        .select('*')
        .order('valid_to');

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'Expired': return 'bg-red-100 text-red-800';
      case 'Critical': return 'bg-orange-100 text-orange-800';
      case 'Warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold">Vehicle Documents</h2>
        <p className="text-sm text-gray-600 mt-2">Track document expiry and compliance</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Days Left</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center">Loading...</td></tr>
            ) : documents.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">All documents are valid</td></tr>
            ) : (
              documents.map((doc, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{doc.vehicle_number}</td>
                  <td className="px-6 py-4">{doc.document_type_name}</td>
                  <td className="px-6 py-4">{new Date(doc.valid_to).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(doc.urgency_level)}`}>
                      {doc.urgency_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">{doc.days_until_expiry}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
