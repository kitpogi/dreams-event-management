import api from '../axios';

export const contactService = {
  submit: (data) => api.post('/contact', data),
  getAll: (params) => api.get('/contact-inquiries', { params }),
  updateStatus: (id, status) => api.patch(`/contact-inquiries/${id}/status`, { status }),
  reply: (id, data) => api.post(`/contact-inquiries/${id}/reply`, data),
  bulkDelete: (ids) => api.delete('/contact-inquiries/bulk', { data: { ids } }),
};

