import api from '../axios';

export const taskService = {
  // Get all tasks for a booking
  getByBooking: (bookingId) => {
    return api.get(`/bookings/${bookingId}/tasks`);
  },

  // Create a new task
  create: (bookingId, data) => {
    return api.post(`/bookings/${bookingId}/tasks`, data);
  },

  // Update a task
  update: (taskId, data) => {
    return api.patch(`/tasks/${taskId}`, data);
  },

  // Delete a task
  delete: (taskId) => {
    return api.delete(`/tasks/${taskId}`);
  },
};
