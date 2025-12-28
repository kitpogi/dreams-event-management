import { useNavigate } from 'react-router-dom';
import { ContactFormModal } from '../../components/modals';

const ContactUs = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <ContactFormModal
        isOpen={true}
        onClose={handleClose}
      />
    </div>
  );
};

export default ContactUs;

