import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminNavbar from '../../../components/layout/AdminNavbar';
import { Button, Input, ConfirmationModal, LoadingSpinner } from '../../../components/ui';
import { Card, CardContent, CardFooter } from '../../../components/ui/Card';
import { useSidebar } from '../../../context/SidebarContext';

const ManageVenues = () => {
  const { isCollapsed } = useSidebar();
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
    <div className="flex">
      <AdminSidebar />
      <AdminNavbar />
      <main
        className="flex-1 bg-gradient-to-b from-[#FFF7F0] to-white dark:from-gray-900 dark:to-gray-800 min-h-screen transition-all duration-300 pt-16"
        style={{
          marginLeft: isCollapsed ? '5rem' : '16rem',
          width: isCollapsed ? 'calc(100% - 5rem)' : 'calc(100% - 16rem)',
        }}
      >
        <div className="p-4 sm:p-6 lg:p-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white transition-colors duration-300">
              Manage Venues
            </h1>
            <Button onClick={() => handleOpenModal()}>+ Add New Venue</Button>
          </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <Card 
                key={venue.id} 
                className="flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <CardContent className="flex-1 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                    {venue.name}
                  </h3>
                  <div className="text-gray-600 dark:text-gray-400 mb-4 space-y-2 transition-colors duration-300">
                    <p className="flex items-center text-sm">
                      <span className="mr-2 text-lg">📍</span> 
                      <span className="truncate">{venue.location}</span>
                    </p>
                    <p className="flex items-center text-sm">
                      <span className="mr-2 text-lg">👥</span> 
                      <span>Capacity: {venue.capacity?.toLocaleString() || 'N/A'} guests</span>
                    </p>
                  </div>
                  {venue.description && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 transition-colors duration-300">
                      {venue.description}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700 px-6 pb-6 transition-colors duration-300">
                  <button
                    onClick={() => handleOpenModal(venue)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(venue.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-300"
                  >
                    Delete
                  </button>
                </CardFooter>
              </Card>
            ))}
            {venues.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 transition-colors duration-300">
                No venues found. Create one to get started.
              </div>
            )}
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
      </main>
    </div>
  );
};

export default ManageVenues;

