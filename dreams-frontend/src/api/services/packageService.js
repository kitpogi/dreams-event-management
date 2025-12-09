import api from '../axios';

export const packageService = {
  getAll: (params = {}) => api.get('/packages', { params }),
  getById: (id) => api.get(`/packages/${id}`),
  create: (data) => api.post('/packages', data),
  update: (id, data) => api.put(`/packages/${id}`, data),
  delete: (id) => api.delete(`/packages/${id}`),
};

