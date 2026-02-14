import { useState } from 'react';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { Button, Input } from '../ui';
import { ParticlesBackground, AnimatedBackground } from '../features';

/**
 * Newsletter signup component
 */
const NewsletterSignup = ({ className = '' }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // TODO: Replace with actual newsletter API endpoint when available
      // For now, we'll use the contact endpoint as a placeholder
      const response = await api.post('/contact', {
        name: 'Newsletter Subscriber',
        email: email,
        event_type: 'newsletter',
        message: 'Newsletter subscription request'
      });

      if (response.data.success) {
        setSuccess(true);
        setEmail('');
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`w-full bg-[#0a0a1a] pt-12 pb-20 relative overflow-hidden ${className}`}>
      {/* Section Background Effects - Synchronized */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <AnimatedBackground type="mesh" colors={['#5A45F2', '#7ee5ff']} speed={0.15} blur={true} />
        <ParticlesBackground particleCount={8} particleColor="rgba(126, 229, 255, 0.2)" speed={0.05} interactive={false} />
      </div>

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-10 left-[30%] w-48 h-48 bg-[#5A45F2] opacity-5 rounded-full blur-[80px]" />
        <div className="absolute top-10 right-[30%] w-64 h-64 bg-[#7ee5ff] opacity-5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] shadow-lg shadow-[#5A45F2]/30 mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Stay Updated with Our Latest Events
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new packages, special offers, and event planning tips.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
                className="w-full h-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || success}
              className="h-12 px-8 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white hover:shadow-lg hover:shadow-[#5A45F2]/30 font-bold whitespace-nowrap rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subscribing...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Subscribed!
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Subscribe
                </>
              )}
            </Button>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-200 text-center">{error}</p>
          )}

          {success && (
            <p className="mt-3 text-sm text-white/90 text-center">
              Thank you for subscribing! Check your email for confirmation.
            </p>
          )}
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
};

export default NewsletterSignup;
