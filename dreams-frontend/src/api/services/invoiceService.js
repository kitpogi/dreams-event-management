import api from '../axios';

/**
 * Invoice Service
 * Handles all invoice-related API calls
 */

export const invoiceService = {
  /**
   * Get all invoices for the current user
   */
  getAll: async () => {
    const response = await api.get('/invoices');
    return response.data;
  },

  /**
   * Get invoice details by ID
   */
  getById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  /**
   * Download invoice PDF
   * Returns a blob which can be used to create a download link
   */
  download: async (id) => {
    const response = await api.get(`/invoices/${id}/download`, {
      responseType: 'blob', // Important for file download
    });
    return response.data;
  },

  /**
   * Generate an invoice for a specific booking
   */
  generate: async (bookingId, notes = null) => {
    const response = await api.post(`/bookings/${bookingId}/invoices`, { notes });
    return response.data;
  },
};
