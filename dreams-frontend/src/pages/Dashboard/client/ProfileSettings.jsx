import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileSettingsModal from '../../../components/modals/ProfileSettingsModal';

const ProfileSettings = () => {
  const [showModal, setShowModal] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure modal is open when component mounts
    setShowModal(true);
  }, []);

  const handleClose = () => {
    setShowModal(false);
    // Small delay before navigation to allow modal to close smoothly
    setTimeout(() => {
      navigate('/dashboard');
    }, 100);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-all duration-300">
      <div className="p-4 sm:p-6 lg:p-10">
        {/* Profile Settings Modal - Same as AdminDashboard */}
        <ProfileSettingsModal 
          isOpen={showModal} 
          onClose={handleClose} 
        />
      </div>
    </div>
  );
};

export default ProfileSettings;

