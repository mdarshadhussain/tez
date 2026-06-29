import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Server } from 'lucide-react';

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "Information We Collect",
      icon: <Eye className="text-blue-400" size={24} />,
      content: "We collect personal information such as your email address, phone number, and payment details when you register and interact with our platform. We also collect usage data, device information, and IP addresses for security and analytics purposes."
    },
    {
      title: "How We Use Your Data",
      icon: <FileText className="text-emerald-400" size={24} />,
      content: "Your data is used to provide, maintain, and improve our services. This includes processing transactions, verifying your identity, sending important notifications, and personalizing your gaming experience. We strictly use your data for legitimate business purposes."
    },
    {
      title: "Data Security",
      icon: <Shield className="text-purple-400" size={24} />,
      content: "We implement state-of-the-art security measures, including SSL encryption and secure server infrastructure, to protect your personal and financial information against unauthorized access, alteration, or disclosure."
    },
    {
      title: "Data Sharing & Third Parties",
      icon: <Server className="text-orange-400" size={24} />,
      content: "We do not sell your personal data. We only share information with trusted third-party service providers (like payment processors) strictly for the purpose of operating our platform. All partners comply with stringent data protection standards."
    },
    {
      title: "Your Privacy Rights",
      icon: <Lock className="text-rose-400" size={24} />,
      content: "You have the right to access, correct, or request the deletion of your personal data at any time. If you have any concerns regarding your privacy or wish to exercise your rights, please contact our support team."
    }
  ];

  return (
    <div className="min-h-full pb-20 p-4 md:p-8 flex flex-col items-center">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl text-center mb-12 relative"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#3de796]/20 rounded-full blur-[60px] pointer-events-none" />
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-md mb-4">
          Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3de796] to-emerald-600">Policy</span>
        </h1>
        <p className="text-slate-500 dark:text-text-muted font-medium max-w-2xl mx-auto">
          We value your trust. Learn how we collect, use, and protect your personal information to ensure a safe and secure gaming environment.
        </p>
      </motion.div>

      {/* Content Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {sections.map((sec, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-slate-50 dark:bg-[#141622]/80 backdrop-blur-md border border-black/10 dark:border-white/5 rounded-3xl p-6 md:p-8 hover:bg-slate-100 dark:bg-[#1a1c29] hover:border-black/15 dark:border-white/10 transition-all duration-300 shadow-xl ${idx === 0 ? 'md:col-span-2' : ''}`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center shadow-inner border border-black/10 dark:border-white/5">
                {sec.icon}
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-wide">{sec.title}</h2>
            </div>
            <p className="text-slate-900 dark:text-white/60 leading-relaxed text-sm md:text-base">
              {sec.content}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Footer Note */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-center text-xs font-bold text-slate-900 dark:text-white/30 uppercase tracking-widest"
      >
        Last Updated: June 2026
      </motion.div>
    </div>
  );
}
