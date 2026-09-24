import React from 'react'

export function LegalScreen({ type, onBack }: { type: 'terms' | 'privacy' | 'refund', onBack: () => void }) {
  const content = {
    terms: {
      title: 'Terms & Conditions',
      date: 'Effective: August 1, 2026',
      sections: [
        { h: '1. Acceptance of Terms', p: 'By accessing or using Nestly, you agree to be bound by these Terms. If you disagree, do not use the service.' },
        { h: '2. User Responsibilities', p: 'You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.' },
        { h: '3. Listings & Accuracy', p: 'All listings must be accurate and truthful. Nestly reserves the right to remove any listing deemed inappropriate or misleading.' },
        { h: '4. Liability', p: 'Nestly acts solely as a platform to connect renters and listers. We are not liable for any disputes arising between users.' }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      date: 'Effective: August 1, 2026',
      sections: [
        { h: '1. Information We Collect', p: 'We collect information you provide directly, such as your name, email, and phone number, as well as data about your interactions with the app.' },
        { h: '2. How We Use Data', p: 'Your data is used to provide, maintain, and improve our services, and to communicate with you regarding your account and listings.' },
        { h: '3. Data Sharing', p: 'We do not sell your personal data. We may share data with trusted third-party service providers who assist us in operating our app.' },
        { h: '4. Security', p: 'We implement industry-standard security measures to protect your personal information from unauthorized access.' }
      ]
    },
    refund: {
      title: 'Refund Policy',
      date: 'Effective: August 1, 2026',
      sections: [
        { h: '1. Premium Listing Fees', p: 'Fees paid for premium listing placements or verifications are generally non-refundable once the service has been rendered.' },
        { h: '2. Accidental Charges', p: 'If you believe you were charged in error, please contact our support team within 7 days of the charge for a full refund.' },
        { h: '3. Cancellation', p: 'You may cancel your premium services at any time, but no prorated refunds will be provided for unused time.' },
        { h: '4. Changes to Policy', p: 'Nestly reserves the right to modify this refund policy at any time. Continued use implies acceptance.' }
      ]
    }
  }[type]

  return (
    <div className="flex flex-col h-full bg-[#f7f5f1]">
      <div className="sticky top-0 z-20 px-4 pt-12 pb-4 bg-[#f7f5f1]/90 backdrop-blur-md border-b border-[#e2ddd8] flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-[#1a3d2b] active:bg-stone-200 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-base font-bold text-[#141414]">{content.title}</h2>
        <div className="w-9"></div>
      </div>
      <div className="px-5 py-6 overflow-y-auto pb-24">
        <p className="text-xs font-semibold text-[#7a7570] uppercase tracking-wider mb-6">{content.date}</p>
        <div className="space-y-6">
          {content.sections.map((sec, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-[#e2ddd8] shadow-sm">
              <h3 className="text-sm font-bold text-[#1a3d2b] mb-2">{sec.h}</h3>
              <p className="text-xs text-[#5a5550] leading-relaxed">{sec.p}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="text-[11px] text-[#7a7570]">If you have any questions, please contact</p>
          <p className="text-[11px] font-bold text-[#1a3d2b] mt-0.5">support@nestly.com</p>
        </div>
      </div>
    </div>
  )
}

export default LegalScreen
