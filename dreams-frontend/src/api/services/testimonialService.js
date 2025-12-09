import api from '../axios';

export const testimonialService = {
  getAll: () => api.get('/testimonials'),
  create: (data) => api.post('/testimonials', data),
  clientSubmit: (data) => api.post('/testimonials/submit', data),
  update: (id, data) => api.put(`/testimonials/${id}`, data),
  delete: (id) => api.delete(`/testimonials/${id}`),
};

