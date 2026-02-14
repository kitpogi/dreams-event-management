import { useNavigate, useLocation } from 'react-router-dom';
import { ContactFormModal } from '../../components/modals';
import { AnimatedBackground, ParticlesBackground } from '../../components/features';

const ContactUs = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

      <div className="relative z-10 w-full max-w-4xl px-4">
        <ContactFormModal
          isOpen={true}
          onClose={handleClose}
          initialData={location.state || {}}
        />
      </div>
    </div>
  );
};

export default ContactUs;
