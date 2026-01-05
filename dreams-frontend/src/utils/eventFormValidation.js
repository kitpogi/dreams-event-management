// Validation functions for event form

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateField = (name, value, formData = {}) => {
  let error = '';
  
  switch (name) {
    case 'first_name':
    case 'last_name':
      if (!value.trim()) {
        error = 'This field is required';
      } else if (value.trim().length < 2) {
        error = 'Must be at least 2 characters';
      }
      break;
    case 'email':
      if (!value.trim()) {
        error = 'Email is required';
      } else if (!validateEmail(value)) {
        error = 'Please enter a valid email address';
      }
      break;
    case 'phone_number':
      if (!value.trim()) {
        error = 'Phone number is required';
      } else if (!validatePhone(value)) {
        error = 'Please enter a valid phone number';
      }
      break;
    case 'event_date':
      if (!value) {
        error = 'Event date is required';
      } else {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          error = 'Event date cannot be in the past';
        }
      }
      break;
    case 'event_time':
      if (!value) {
        error = 'Event time is required';
      }
      break;
    case 'venue':
      if (!value.trim()) {
        error = 'Venue is required';
      } else if (value.trim().length < 3) {
        error = 'Please provide a valid venue name';
      }
      break;
    case 'event_type':
      if (!value) {
        error = 'Please select an event type';
      }
      break;
    case 'guest_range':
      if (!value) {
        error = 'Number of guests is required';
      } else if (parseInt(value) < 1) {
        error = 'Must be at least 1 guest';
      } else if (parseInt(value) > 10000) {
        error = 'Maximum 10,000 guests';
      }
      break;
    case 'budget_range':
      if (!value) {
        error = 'Budget is required';
      } else {
        const budget = parseFloat(value.replace(/,/g, ''));
        if (isNaN(budget) || budget < 0) {
          error = 'Please enter a valid budget amount';
        } else if (budget < 1000) {
          error = 'Minimum budget is ₱1,000';
        }
      }
      break;
    case 'motifs':
      if (!formData.motifs || formData.motifs.length === 0) {
        error = 'Please select at least one motif';
      }
      break;
    default:
      break;
  }
  
  return error;
};

export const validateForm = (formData) => {
  const errors = {};
  const fieldsToValidate = [
    'first_name', 'last_name', 'email', 'phone_number', 
    'event_date', 'event_time', 'venue', 'event_type', 
    'guest_range', 'budget_range'
  ];
  
  fieldsToValidate.forEach(field => {
    const error = validateField(field, formData[field], formData);
    if (error) {
      errors[field] = error;
    }
  });
  
  if (!formData.motifs || formData.motifs.length === 0) {
    errors.motifs = 'Please select at least one motif';
  }
  
  return errors;
};

