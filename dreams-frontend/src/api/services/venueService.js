import api from '../axios';

export const venueService = {
  getAll: () => api.get('/venues'),
  create: (data) => api.post('/venues', data),
  update: (id, data) => api.put(`/venues/${id}`, data),
  delete: (id) => api.delete(`/venues/${id}`),
};

