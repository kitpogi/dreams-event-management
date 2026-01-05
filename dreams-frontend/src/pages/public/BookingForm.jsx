import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BookingFormModal } from '../../components/modals';

const BookingForm = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <BookingFormModal
        isOpen={true}
        onClose={handleClose}
        packageId={packageId}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default BookingForm;
