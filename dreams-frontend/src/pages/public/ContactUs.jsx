import { useNavigate, useLocation } from 'react-router-dom';
import { ContactFormModal } from '../../components/modals';

const ContactUs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <ContactFormModal
        isOpen={true}
        onClose={handleClose}
        initialData={location.state || {}}
      />
    </div>
  );
};

export default ContactUs;

