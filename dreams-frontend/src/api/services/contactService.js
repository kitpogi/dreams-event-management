import api from '../axios';

export const contactService = {
  submit: (data) => api.post('/contact', data),
  getAll: () => api.get('/contact-inquiries'),
  updateStatus: (id, status) => api.patch(`/contact-inquiries/${id}/status`, { status }),
};

