import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

interface Props {
  tripId: string;
  onClose: () => void;
  onConfirm: (paymentReference: string, paymentDate: string) => Promise<void>;
}

export function MarkPaidModal({ tripId, onClose, onConfirm }: Props) {
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    if (!reference.trim() || !paymentDate) return;
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(reference.trim(), paymentDate);
    } catch (err: any) {
      setError(err.message || 'Failed to mark as paid.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Mark as Paid</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-600">
            Recording payment for trip <span className="font-semibold text-gray-900">{tripId}</span>.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Reference <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="UTR / Cheque / Transfer ID"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reference.trim() || !paymentDate || submitting}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Mark as Paid'}
          </button>
        </div>
      </div>
    </div>
  );
}
