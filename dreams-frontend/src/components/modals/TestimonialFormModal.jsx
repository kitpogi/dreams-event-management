import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Star, Upload, X, Camera, Sparkles, CheckCircle2, Calendar, Tag, MessageSquare } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { FormModal, LoadingSpinner } from '../ui';

const ratingLabels = {
  1: { label: 'Poor', emoji: '😞', color: 'text-red-500' },
  2: { label: 'Fair', emoji: '😐', color: 'text-orange-500' },
  3: { label: 'Good', emoji: '🙂', color: 'text-yellow-500' },
  4: { label: 'Very Good', emoji: '😊', color: 'text-lime-500' },
  5: { label: 'Excellent', emoji: '🤩', color: 'text-emerald-500' },
};

const InteractiveStarRating = ({ rating, onRate, hoveredStar, onHover, onLeave }) => {
  return (
    <div className="flex items-center gap-1" onMouseLeave={onLeave}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hoveredStar || rating);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            onMouseEnter={() => onHover(star)}
            className={`relative p-1 rounded-lg transition-all duration-200 ${
              isActive
                ? 'scale-110'
                : 'hover:scale-105 opacity-40'
            }`}
          >
            <Star
              className={`w-8 h-8 transition-all duration-200 ${
                isActive
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

const TestimonialFormModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    booking_id: '',
    event_type: '',
    event_date: '',
    rating: 5,
    message: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchCompletedBookings();
      setSuccess(false);
    }
  }, [isOpen]);

  const fetchCompletedBookings = async () => {
    try {
      const response = await api.get('/bookings');
      const completedBookings = (response.data.data || response.data || []).filter(
        b => b.booking_status === 'Completed' || 
             b.booking_status === 'Approved' ||
             b.status === 'completed' ||
             b.status === 'approved'
      );
      setBookings(completedBookings);
      
      if (completedBookings.length > 0) {
        const firstBooking = completedBookings[0];
        setFormData(prev => ({
          ...prev,
          booking_id: firstBooking.booking_id || firstBooking.id,
          event_type: firstBooking.package?.package_category || '',
          event_date: firstBooking.event_date || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseInt(value) : value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      const data = new FormData();
      data.append('client_name', user?.name || '');
      data.append('event_type', formData.event_type);
      data.append('event_date', formData.event_date);
      data.append('rating', formData.rating);
      data.append('message', formData.message);
      
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      await api.post('/testimonials/submit', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);

      setTimeout(() => {
        setFormData({
          booking_id: '',
          event_type: '',
          event_date: '',
          rating: 5,
          message: '',
        });
        setAvatarFile(null);
        setAvatarPreview(null);
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 2500);
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast.error(error.response?.data?.message || 'Failed to submit testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredStar || formData.rating;
  const ratingInfo = ratingLabels[displayRating];
  const charCount = formData.message.length;
  const maxChars = 500;

  // Success state
  if (success) {
    return (
      <FormModal isOpen={isOpen} onClose={onClose} title="" size="md">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-5 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Thank You! 🎉
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Your testimonial has been submitted successfully. It will be reviewed before being published.
          </p>
        </div>
      </FormModal>
    );
  }

  return (
    <FormModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title=""
      size="md"
    >
      <div className="space-y-5">
        {/* Header with icon */}
        <div className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Share Your Experience
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Help others by sharing how your event went
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Event Selection */}
          {bookings.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="w-4 h-4" />
                Select Event
              </label>
              <select
                name="booking_id"
                value={formData.booking_id}
                onChange={(e) => {
                  const selectedBooking = bookings.find(b => 
                    String(b.booking_id || b.id) === e.target.value
                  );
                  setFormData({
                    ...formData,
                    booking_id: e.target.value,
                    event_type: selectedBooking?.package?.package_category || formData.event_type,
                    event_date: selectedBooking?.event_date || formData.event_date,
                  });
                }}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all text-sm"
              >
                <option value="">Choose a completed event...</option>
                {bookings.map((booking) => (
                  <option key={booking.booking_id || booking.id} value={booking.booking_id || booking.id}>
                    {booking.package?.package_name || 'Package'} — {new Date(booking.event_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Event Type & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="w-4 h-4" />
                Event Type
              </label>
              <input
                type="text"
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                required
                placeholder="e.g., Wedding, Birthday"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all text-sm"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4" />
                Event Date
              </label>
              <input
                type="date"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Star Rating */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Star className="w-4 h-4" />
              Your Rating
            </label>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
              <InteractiveStarRating
                rating={formData.rating}
                onRate={(star) => setFormData({ ...formData, rating: star })}
                hoveredStar={hoveredStar}
                onHover={setHoveredStar}
                onLeave={() => setHoveredStar(0)}
              />
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ratingInfo.emoji}</span>
                <span className={`text-sm font-semibold ${ratingInfo.color}`}>
                  {ratingInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Testimonial Message */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MessageSquare className="w-4 h-4" />
              Your Testimonial
            </label>
            <div className="relative">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="4"
                maxLength={maxChars}
                placeholder="Tell us about your experience — what made it special?"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all text-sm resize-none"
              />
              <span className={`absolute bottom-3 right-3 text-xs ${
                charCount > maxChars * 0.9 ? 'text-amber-500' : 'text-gray-400'
              }`}>
                {charCount}/{maxChars}
              </span>
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Camera className="w-4 h-4" />
              Your Photo
              <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            
            {avatarPreview ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-purple-500/20"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {avatarFile?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(avatarFile?.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-500 dark:hover:border-purple-500 dark:hover:text-purple-400 transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                Click to upload a photo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.message.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] disabled:hover:scale-100"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Submitting...
                </span>
              ) : (
                'Submit Testimonial'
              )}
            </button>
          </div>
        </form>
      </div>
    </FormModal>
  );
};

export default TestimonialFormModal;

