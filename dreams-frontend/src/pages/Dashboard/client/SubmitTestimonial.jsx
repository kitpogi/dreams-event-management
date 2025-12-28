import { useNavigate } from 'react-router-dom';
import { TestimonialFormModal } from '../../../components/modals';

const SubmitTestimonial = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/dashboard');
  };

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <TestimonialFormModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default SubmitTestimonial;

