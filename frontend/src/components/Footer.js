import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Mail, Phone, Github, Twitter, Linkedin, Send } from 'lucide-react';

const Footer = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <footer className="relative z-10 mt-24 border-t border-white/10">
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent pointer-events-none"
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
              <div className="p-2 rounded-xl bg-gradient">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-gradient">Study</span>Shield
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Your AI-powered sanctuary for focused learning on YouTube.
            </p>
            <div className="flex gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="p-2.5 glass rounded-xl hover:border-primary-500/50 border border-white/10 transition-colors"
                >
                  <Icon className="w-4 h-4 text-gray-400 hover:text-white" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms & Conditions'].map((item) => (
                <li key={item}>
                  <button type="button" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}>
            <h4 className="font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:ayushsrivastavaup62@gmail.com"
                  className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  ayushsrivastavaup62@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:7275794027" className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors">
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
            <h4 className="font-semibold mb-4 text-white">Send a Message</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-modern w-full"
              />
              <input
                type="email"
                placeholder="Your email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-modern w-full"
              />
              <textarea
                placeholder="Your message"
                required
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="input-modern w-full resize-none"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient rounded-xl font-semibold text-sm ripple"
              >
                {submitted ? 'Message Sent!' : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} StudyShield. All rights reserved.</p>
          <p className="text-gray-600">Built for focused learners everywhere.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
