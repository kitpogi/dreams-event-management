import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BookingFormModal } from '../../components/modals';
import { AnimatedBackground, ParticlesBackground } from '../../components/features';

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
    <div className="bg-[#0a0a1a] min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-20">
          <AnimatedBackground type="mesh" colors={['#5A45F2', '#7ee5ff']} speed={0.15} blur={true} />
        </div>
        <ParticlesBackground particleCount={15} particleColor="rgba(126, 229, 255, 0.15)" speed={0.03} interactive={false} />
      </div>
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
