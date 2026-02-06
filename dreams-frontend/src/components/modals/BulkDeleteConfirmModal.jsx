import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { FormModal, Button, LoadingSpinner } from '../ui';

const BulkDeleteConfirmModal = ({ isOpen, onClose, inquiries, onConfirm, loading }) => {
  const [confirmText, setConfirmText] = useState('');
  const requiredText = 'DELETE';
  const isConfirmed = confirmText === requiredText;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setConfirmText('');
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen || !inquiries || inquiries.length === 0) return null;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Confirm Bulk Delete"
      size="md"
    >
      <div className="space-y-4">
        {/* Warning */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                Warning: This action cannot be undone
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                You are about to permanently delete <strong>{inquiries.length}</strong> contact inquiry(ies). 
                This action cannot be reversed.
              </p>
            </div>
          </div>
        </div>

        {/* Inquiries to delete (limited list) */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Inquiries to be deleted:
          </h4>
          <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {inquiries.slice(0, 10).map((inquiry) => (
                <li key={inquiry.id} className="p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white">
                      {inquiry.name || `${inquiry.first_name || ''} ${inquiry.last_name || ''}`.trim() || 'Unknown'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {inquiry.email}
                    </span>
                  </div>
                </li>
              ))}
              {inquiries.length > 10 && (
                <li className="p-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  ... and {inquiries.length - 10} more
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Confirmation input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type <strong className="text-red-600 dark:text-red-400">{requiredText}</strong> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={requiredText}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
            disabled={loading}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={!isConfirmed || loading}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Deleting...
              </span>
            ) : (
              `Delete ${inquiries.length} Inquiry(ies)`
            )}
          </Button>
        </div>
      </div>
    </FormModal>
  );
};

export default BulkDeleteConfirmModal;

