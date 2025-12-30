import { useState } from 'react';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { Button, Input } from '../ui';

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
    <section className={`w-full bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] py-16 md:py-20 ${className}`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Stay Updated with Our Latest Events
          </h2>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
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
              className="h-12 px-8 bg-white text-[#5A45F2] hover:bg-white/90 font-bold whitespace-nowrap"
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

        <p className="text-center text-white/70 text-sm mt-6">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
};

export default NewsletterSignup;

