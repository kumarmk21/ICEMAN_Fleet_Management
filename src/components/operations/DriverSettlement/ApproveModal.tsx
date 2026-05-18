import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface Props {
  tripId: string;
  onClose: () => void;
  onConfirm: (approvedBy: string) => Promise<void>;
}

export function ApproveModal({ tripId, onClose, onConfirm }: Props) {
  const [approvedBy, setApprovedBy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    if (!approvedBy.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(approvedBy.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to approve.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Approve Settlement</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-600">
            Approving settlement for trip <span className="font-semibold text-gray-900">{tripId}</span>.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Approved By <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your name or employee ID"
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
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
            disabled={!approvedBy.trim() || submitting}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {submitting ? 'Approving...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
