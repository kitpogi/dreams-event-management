import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import { Button, Input, ConfirmationModal, LoadingSpinner } from '../../../components/ui';
import { Card, CardContent, CardFooter } from '../../../components/ui/Card';

const ManageVenues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, venueId: null });

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await api.get('/venues');
      setVenues(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (venue = null) => {
    if (venue) {
      setEditingVenue(venue);
      setFormData({
        name: venue.name,
        location: venue.location,
        capacity: venue.capacity,
        description: venue.description || '',
      });
    } else {
      setEditingVenue(null);
      setFormData({
        name: '',
        location: '',
        capacity: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVenue(null);
    setFormData({
      name: '',
      location: '',
      capacity: '',
      description: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingVenue) {
        await api.put(`/venues/${editingVenue.id}`, formData);
        toast.success('Venue updated successfully');
      } else {
        await api.post('/venues', formData);
        toast.success('Venue created successfully');
      }
      fetchVenues();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving venue:', error);
      toast.error(error.response?.data?.message || 'Failed to save venue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ isOpen: true, venueId: id });
  };

  const handleDelete = async () => {
    const id = deleteConfirm.venueId;
    if (!id) return;

    try {
      await api.delete(`/venues/${id}`);
      setVenues(venues.filter((v) => v.id !== id));
      toast.success('Venue deleted successfully');
    } catch (error) {
      console.error('Error deleting venue:', error);
      toast.error(error.response?.data?.message || 'Failed to delete venue');
    } finally {
      setDeleteConfirm({ isOpen: false, venueId: null });
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-900/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300/20 dark:bg-blue-900/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto">
          {/* Header Section with Icon */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Manage Venues
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-300 font-medium">
                  Create and manage event venues
                </p>
              </div>
            </div>
            <Button 
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 font-bold px-8 py-4 rounded-2xl"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Venue
            </Button>
          </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/50">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 mb-6">
              <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No venues found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-base mb-8">Create your first venue to get started</p>
            <Button 
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 font-bold px-8 py-4 rounded-2xl"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Venue
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <Card 
                key={venue.id} 
                className="flex flex-col h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 border-indigo-100 dark:border-indigo-900/50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 rounded-3xl overflow-hidden group"
              >
                <CardContent className="flex-1 p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                    {venue.name}
                  </h3>
                  <div className="text-gray-600 dark:text-gray-400 mb-4 space-y-3">
                    <p className="flex items-center text-sm font-medium">
                      <span className="mr-3 text-lg">📍</span> 
                      <span className="truncate">{venue.location}</span>
                    </p>
                    <p className="flex items-center text-sm font-medium">
                      <span className="mr-3 text-lg">👥</span> 
                      <span>Capacity: <span className="font-bold text-gray-900 dark:text-white">{venue.capacity?.toLocaleString() || 'N/A'}</span> guests</span>
                    </p>
                  </div>
                  {venue.description && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed">
                      {venue.description}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700/50 px-6 pb-6 bg-gray-50/50 dark:bg-gray-800/30">
                  <button
                    onClick={() => handleOpenModal(venue)}
                    className="px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-300 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(venue.id)}
                    className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-300 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700"
                  >
                    Delete
                  </button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-xl transform transition-all border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white transition-colors duration-300">
                {editingVenue ? 'Edit Venue' : 'Add New Venue'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                    Venue Name *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Grand Ballroom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                    Location *
                  </label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Makati City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                    Capacity *
                  </label>
                  <Input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Max guests"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                    placeholder="Brief description of the venue..."
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Venue'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, venueId: null })}
          onConfirm={handleDelete}
          title="Delete Venue"
          message="Are you sure you want to delete this venue? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
        </div>
    </div>
  );
};

export default ManageVenues;

