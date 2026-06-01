import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Mail, Phone, Github, Twitter, Linkedin, Send } from 'lucide-react';

const Footer = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSending) return;

    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
    const toEmail = process.env.REACT_APP_CONTACT_TO_EMAIL || 'ayushsrivastavaup62@gmail.com';

    if (!serviceId || !templateId || !publicKey) {
      setStatus({
        type: 'error',
        message: 'Contact form is not configured yet. Please add the EmailJS environment variables.',
      });
      return;
    }

    setIsSending(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: toEmail,
            from_name: form.name,
            from_email: form.email,
            reply_to: form.email,
            message: form.message,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('EmailJS request failed');
      }

      setForm({ name: '', email: '', message: '' });
      setStatus({ type: 'success', message: 'Message sent successfully.' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Could not send your message. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <footer className="relative z-10 mt-24 border-t border-primary-900/10 text-primary-900">
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-[#ded8f4] via-[#ebe6fb]/90 to-transparent pointer-events-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
        >
          <motion.div whileHover={{ y: -2 }} className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-gradient shadow-glow-sm">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-gradient">Study</span>Shield
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Your AI-powered sanctuary for focused learning on YouTube.
            </p>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-6 inline-flex items-center gap-3 rounded-2xl bg-white/60 border border-primary-900/10 px-4 py-3 cartoon-blob"
            >
              <div className="h-10 w-10 rounded-2xl bg-accent-200 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-800" />
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 w-24 rounded-full bg-primary-200" />
                <div className="h-2.5 w-16 rounded-full bg-accent-200" />
              </div>
            </motion.div>
            <div className="flex gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="p-2.5 glass rounded-xl hover:border-primary-500/50 border border-primary-900/10 transition-colors"
                >
                  <Icon className="w-4 h-4 text-slate-600 hover:text-primary-900" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <h4 className="font-semibold mb-4 text-primary-900">Legal</h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms & Conditions'].map((item) => (
                <li key={item}>
                  <button type="button" className="text-slate-600 hover:text-primary-700 text-sm transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            id="footer-contact"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="scroll-mt-24"
          >
            <h4 className="font-semibold mb-4 text-primary-900">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:ayushsrivastavaup62@gmail.com"
                  className="flex items-center gap-2 text-slate-600 hover:text-primary-700 transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  ayushsrivastavaup62@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:7275794027" className="flex items-center gap-2 text-slate-600 hover:text-primary-700 transition-colors">
                  <Phone className="w-4 h-4 shrink-0" />
                  7275794027
                </a>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 md:col-span-2"
          >
            <h4 className="font-semibold mb-4 text-primary-900">Send a Message</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                required
                disabled={isSending}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-modern w-full"
              />
              <input
                type="email"
                placeholder="Your email"
                required
                disabled={isSending}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-modern w-full"
              />
              <textarea
                placeholder="Your message"
                required
                rows={3}
                disabled={isSending}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="input-modern w-full resize-none"
              />
              {status.message && (
                <p className={`text-sm ${status.type === 'success' ? 'text-emerald-700' : 'text-accent-700'}`}>
                  {status.message}
                </p>
              )}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient rounded-xl font-semibold text-sm ripple disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSending ? 'Sending...' : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>

        <div className="mt-12 pt-8 border-t border-primary-900/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <p>© {new Date().getFullYear()} StudyShield. All rights reserved.</p>
          <p className="text-slate-500">
            Built and Brained by{' '}
            <a
              href="https://ayush-portfolio-ten-omega.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary-700 hover:text-primary-900 underline decoration-primary-400/40 underline-offset-4 transition-colors"
            >
              Ayush Srivastava
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
