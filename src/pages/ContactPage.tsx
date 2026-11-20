import { useState } from 'react';
import { Mail, MapPin, Phone, Clock, CheckCircle2 } from 'lucide-react';
import { SITE_CONFIG, usePageSeo } from '../config/site.ts';
import { apiRequest } from '../lib/api.ts';
import { useToast } from '../context/ToastContext.tsx';

export function ContactPage() {
  usePageSeo('Contact Us', `Contact ${SITE_CONFIG.businessName} for venue tours, availability, and custom event inquiries.`);
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Please enter a message of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      showToast('Your message has been sent. Our team will respond shortly.', 'success');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section-spacing bg-[#F7F8FA]">
      <div className="site-container space-y-10">
        <div className="max-w-xl space-y-2">
          <h1 className="h1-title">Contact Our Event Concierge</h1>
          <p className="body-text">
            Schedule a private hall walkthrough or ask our coordinators about custom date packages.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Form */}
          <div className="lg:col-span-7 card-surface p-6 md:p-8">
            {submitted ? (
              <div className="py-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h2 className="h2-title">Thank You for Reaching Out</h2>
                <p className="body-text max-w-md mx-auto">
                  Your inquiry has been saved to our concierge inbox. A coordinator will contact you within one business day.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="btn-primary"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <h2 className="h2-title">Send a Message</h2>

                {error && (
                  <div role="alert" className="p-3.5 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-[14px]">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="block text-[14px] font-medium text-[#1F2937]">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Claire Bennett"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-email" className="block text-[14px] font-medium text-[#1F2937]">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="block text-[14px] font-medium text-[#1F2937]">
                    Event Details or Question
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us your preferred date, estimated guest count, or tour availability..."
                    className="input-field py-3"
                  />
                </div>

                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Direct Contact Info & Map Placeholder */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card-surface p-6 md:p-8 space-y-5">
              <h2 className="h3-title">Direct Venue Information</h2>
              <ul className="space-y-4 text-[15px] text-[#1F2937]">
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#45459E] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="small-text">{SITE_CONFIG.phone}</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#45459E] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="small-text">{SITE_CONFIG.email}</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#45459E] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <div className="font-medium">Address</div>
                    <div className="small-text">{SITE_CONFIG.address}</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#45459E] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <div className="font-medium">Tour &amp; Office Hours</div>
                    <div className="small-text">{SITE_CONFIG.hours}</div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Clean Architectural Map Placeholder */}
            <div className="card-surface p-6 space-y-3">
              <h3 className="h3-title">Venue Location</h3>
              <div className="rounded-[12px] bg-[#EDEFF7] h-48 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <MapPin className="w-8 h-8 text-[#201853]" strokeWidth={1.75} />
                <div className="text-[15px] font-semibold text-[#201853]">{SITE_CONFIG.businessName}</div>
                <p className="small-text">{SITE_CONFIG.address}</p>
                <span className="text-[13px] font-medium text-[#45459E]">
                  Complimentary Valet &amp; Guest Parking Entrance on West Avenue
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
