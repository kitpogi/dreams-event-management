import api from '../axios';

export const bookingService = {
  getAll: () => api.get('/bookings'),
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.patch(`/bookings/${id}`, data),
  updateStatus: (id, status) => api.patch(`/bookings/status/${id}`, { status }),
  cancel: (id, reason) => api.post(`/bookings/${id}/cancel`, { cancellation_reason: reason }),
};

