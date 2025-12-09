import api from '../axios';

export const portfolioService = {
  getAll: (params = {}) => api.get('/portfolio-items', { params }),
  create: (data) => api.post('/portfolio-items', data),
  update: (id, data) => api.put(`/portfolio-items/${id}`, data),
  delete: (id) => api.delete(`/portfolio-items/${id}`),
};

