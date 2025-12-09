import api from '../axios';

export const recommendationService = {
  recommend: (data) => api.post('/recommend', data),
};

