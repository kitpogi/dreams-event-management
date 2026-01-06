import api from '../axios';

/**
 * Payment Service
 * Handles all payment-related API calls
 */

/**
 * Create a payment intent for a booking
 */
export const createPaymentIntent = async (bookingId, amount, paymentMethods = ['card', 'gcash', 'maya']) => {
  try {
    const response = await api.post('/payments/create-intent', {
      booking_id: bookingId,
      amount: amount,
      payment_methods: paymentMethods,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Attach payment method to payment intent
 */
export const attachPaymentMethod = async (paymentIntentId, paymentMethodId) => {
  try {
    const response = await api.post('/payments/attach-method', {
      payment_intent_id: paymentIntentId,
      payment_method_id: paymentMethodId,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get payment status
 */
export const getPaymentStatus = async (paymentId) => {
  try {
    const response = await api.get(`/payments/${paymentId}/status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get all payments for a booking
 */
export const getBookingPayments = async (bookingId) => {
  try {
    const response = await api.get(`/bookings/${bookingId}/payments`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Create payment link for invoice
 */
export const createPaymentLink = async (bookingId, amount, description = null) => {
  try {
    const response = await api.post(`/bookings/${bookingId}/payment-link`, {
      amount: amount,
      description: description,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

