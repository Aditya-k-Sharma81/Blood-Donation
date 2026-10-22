import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HeartPulse,
  HeartHandshake,
  Calendar,
  ClipboardList,
  User,
  LogOut,
  Droplets,
  MapPin,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Activity,
  Clock,
  Sparkles,
  Phone,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  Award,
  Radio,
  Building,
  Check
} from 'lucide-react';
import MedicalReportModal from '../components/MedicalReportModal';
import DonorAuth from '../components/DonorAuth';
import heroBloodDonorImg from '../assets/hero-blood-donor.jpg';

// Blood Group Compatibility Data
const BLOOD_COMPATIBILITY = {
  'O-': {
    label: 'O Negative',
    giveTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    receiveFrom: ['O-'],
    category: 'Universal Red Blood Cell Donor',
    demand: 'Critical Emergency Need',
    tagColor: 'bg-rose-100 text-rose-800 border-rose-300',
    description:
      'O- is the true Universal Donor for red blood cells. Trauma and emergency rooms rely on O- blood when a patient’s blood type is unknown.'
  },
  'O+': {
    label: 'O Positive',
    giveTo: ['O+', 'A+', 'B+', 'AB+'],
    receiveFrom: ['O+', 'O-'],
    category: 'Most Common Blood Group',
    demand: 'High Daily Demand',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description:
      'Over 37% of the population has O+ blood. It is the most frequently transfused blood type across surgery and intensive care.'
  },
  'A+': {
    label: 'A Positive',
    giveTo: ['A+', 'AB+'],
    receiveFrom: ['A+', 'A-', 'O+', 'O-'],
    category: 'High Transfusion Frequency',
    demand: 'High Demand',
    tagColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description:
      'A+ donors are vital for platelets and red cells, regularly needed for cancer patients undergoing chemotherapy.'
  },
  'A-': {
    label: 'A Negative',
    giveTo: ['A+', 'A-', 'AB+', 'AB-'],
    receiveFrom: ['A-', 'O-'],
    category: 'Rare & Critical Donor',
    demand: 'Urgent Shortage Risk',
    tagColor: 'bg-rose-100 text-rose-800 border-rose-300',
    description:
      'Only 6% of donors have A- blood. It is urgently needed for scheduled cardiac surgeries and neonatal transfusions.'
  },
  'B+': {
    label: 'B Positive',
    giveTo: ['B+', 'AB+'],
    receiveFrom: ['B+', 'B-', 'O+', 'O-'],
    category: 'Essential Regional Need',
    demand: 'Moderate Demand',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description:
      'B+ is prevalent and in steady demand for organ transplants, thalassemia patients, and routine hematology care.'
  },
  'B-': {
    label: 'B Negative',
    giveTo: ['B+', 'B-', 'AB+', 'AB-'],
    receiveFrom: ['B-', 'O-'],
    category: 'Very Rare Blood Group',
    demand: 'Critical Emergency Need',
    tagColor: 'bg-red-100 text-red-800 border-red-300',
    description:
      'Less than 2% of people have B- blood. Blood banks maintain emergency reserve calls specifically for this group.'
  },
  'AB+': {
    label: 'AB Positive',
    giveTo: ['AB+'],
    receiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    category: 'Universal Red Cell Recipient',
    demand: 'Ideal Plasma Donor',
    tagColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description:
      'AB+ individuals can safely receive red blood cells from any blood type. Their plasma is universal and saves burn victims.'
  },
  'AB-': {
    label: 'AB Negative',
    giveTo: ['AB+', 'AB-'],
    receiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    category: 'Rarest Blood Group (<1%)',
    demand: 'Ultra-Rare Lifesaver',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description:
      'The rarest blood type in the world. AB- donors are key contributors for both specialized red cells and universal plasma.'
  }
};

const FAQS = [
  {
    q: 'Does donating blood hurt?',
    a: 'Not at all! You will only feel a momentary, gentle pinch for 2-3 seconds when the sterile needle is inserted. During the rest of the 10-15 minute donation, you can relax comfortably.'
  },
  {
    q: 'How much blood is taken and how fast does the body recover?',
    a: 'A standard donation is roughly 350ml to 450ml (about 8-10% of your total blood volume). Your body naturally replenishes the lost fluid volume within 24–48 hours, and red blood cells are fully restored within 4–6 weeks.'
  },
  {
    q: 'How often can I donate blood?',
    a: 'Healthy adults can safely donate whole blood every 90 days (3 months for men) and every 120 days (4 months for women). Platelet donations can be done more frequently, up to every 2 weeks.'
  },
  {
    q: 'What should I do before and after donating?',
    a: 'Drink plenty of water (at least 500ml) beforehand, have a light nutritious meal (avoid greasy foods), and get good rest. After donating, enjoy juice and snacks, avoid strenuous heavy lifting for a few hours, and stay well hydrated.'
  }
];

export default function DonorPage({
  user,
  onLogout,
  autoLocation,
  onLoginSuccess,
  authModalOpen: externalAuthModalOpen,
  setAuthModalOpen: externalSetAuthModalOpen,
  authMode: externalAuthMode,
  setAuthMode: externalSetAuthMode,
}) {
  const navigate = useNavigate();
  const [mismatchAlert, setMismatchAlert] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  // Auth Modal State (for guest visitors)
  const [internalAuthModalOpen, setInternalAuthModalOpen] = useState(false);
  const [internalAuthMode, setInternalAuthMode] = useState('signup'); // 'signup' | 'login'

  const authModalOpen = externalAuthModalOpen !== undefined ? externalAuthModalOpen : internalAuthModalOpen;
  const setAuthModalOpen = externalSetAuthModalOpen || setInternalAuthModalOpen;
  const authMode = externalAuthMode !== undefined ? externalAuthMode : internalAuthMode;
  const setAuthMode = externalSetAuthMode || setInternalAuthMode;

  // Selected Blood Group in Compatibility Tool
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(() => {
    return user?.bloodGroup || 'O+';
  });

  // Eligibility Checklist State
  const [eligibilityAnswers, setEligibilityAnswers] = useState({
    age: true,
    weight: true,
    health: true,
    interval: true
  });

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // Check for blood group discrepancy notifications (for logged in donor)
  useEffect(() => {
    const checkMismatch = async () => {
      try {
        const donorId = user?.id || user?._id || '';
        const donorEmail = user?.email || '';
        if (!donorId && !donorEmail) return;

        const params = new URLSearchParams();
        if (donorId) params.append('donorId', donorId);
        if (donorEmail) params.append('email', donorEmail);

        const res = await fetch(`/api/donor/notifications?${params.toString()}`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.notifications)) {
          const mismatch = data.notifications.find((n) => n.type === 'BLOOD_GROUP_MISMATCH');
          if (mismatch) setMismatchAlert(mismatch);
        }
      } catch (e) { }
    };
    if (user) {
      checkMismatch();
    }
  }, [user?.id, user?._id, user?.email]);

  // Handle URL hash or query for auth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authQuery = params.get('auth');
    if (authQuery === 'login' || authQuery === 'signup') {
      setAuthMode(authQuery);
      setAuthModalOpen(true);
    }
  }, []);

  const openAuth = (mode = 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const isProfileSet = Boolean(
    user?.isProfileSet ||
    (user?.phone?.trim() && (user?.lastLocation?.trim() || user?.permanentLocation?.trim() || user?.currentLocation?.trim()) && user?.bloodGroup?.trim())
  );

  const formatLastSync = (dateVal) => {
    if (!dateVal) return 'Live background GPS active';
    try {
      const d = new Date(dateVal);
      return `Synced at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Every 5 mins';
    }
  };

  const isEligible = Object.values(eligibilityAnswers).every(Boolean);

  const handleEligibilityToggle = (key) => {
    setEligibilityAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentCompat = BLOOD_COMPATIBILITY[selectedBloodGroup] || BLOOD_COMPATIBILITY['O+'];

  return (
    <div className="w-full flex flex-col bg-white text-slate-900">
      {/* Blood Group Discrepancy Alert Banner (If Any) */}
      {mismatchAlert && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Medical Notice: Blood Group Discrepancy
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    Lab Verified
                  </span>
                </div>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  {mismatchAlert.message}
                </p>
                {mismatchAlert.details?.verifiedBloodGroup && (
                  <p className="text-[11px] text-amber-950 mt-1 font-bold">
                    Verified Blood Group: <span className="text-rose-700 font-extrabold">{mismatchAlert.details.verifiedBloodGroup}</span> (was {mismatchAlert.details.registeredBloodGroup})
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedReport(mismatchAlert)}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <FileText size={13} />
              <span>View Full Report</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION WITH IMAGE & CALL TO ACTION */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-12 md:pb-20 bg-gradient-to-b from-rose-50/40 via-white to-slate-50 border-b border-slate-200/80">
        {/* Soft decorative background circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40">
          <div className="absolute -top-24 left-1/4 w-96 h-96 bg-rose-200/50 rounded-full blur-3xl"></div>
          <div className="absolute top-12 right-1/4 w-80 h-80 bg-red-100/60 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
              {/* Network Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                <span className="text-xs font-bold tracking-wide uppercase">
                  National Voluntary Blood Network
                </span>
                <span className="hidden sm:inline text-rose-300">|</span>
                <span className="hidden sm:inline text-xs font-medium text-slate-600">
                  Real-Time Hospital Link
                </span>
              </div>

              {/* Catchy Main Heading */}
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                  Give Blood, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-red-600 to-rose-700">
                    Save Lives.
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl font-bold text-slate-700 tracking-tight">
                  Every Drop Connects A Future.
                </p>
              </div>

              {/* Subtitle / Value Proposition */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                A single voluntary blood donation takes less than 15 minutes and can save up to{' '}
                <strong className="text-slate-900 font-extrabold">three human lives</strong>.
                Our automated network links voluntary donors with verified hospitals, trauma care, and pediatric surgery centers in real-time.
              </p>

              {/* Trust & Medical Features Pill Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>100% Sterile & Certified</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                  <Activity size={14} className="text-rose-600" />
                  <span>Free Clinical Health Check</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                  <Radio size={14} className="text-indigo-600" />
                  <span>Emergency Radius Alerts</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2 w-full sm:w-auto">
                {user && user.role === 'DONOR' ? (
                  <>
                    <button
                      onClick={() => navigate('/appointment')}
                      className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <Calendar size={18} />
                      <span>Book Donation Slot</span>
                    </button>
                    <button
                      onClick={() => navigate('/my-bookings')}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-300 shadow-xs transition-all hover:border-slate-400 cursor-pointer"
                    >
                      <ClipboardList size={18} className="text-rose-600" />
                      <span>My Bookings</span>
                    </button>
                    <a
                      href="#compatibility"
                      className="flex items-center justify-center gap-1.5 px-4 py-3.5 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors"
                    >
                      <span>Check Compatibility</span>
                      <ArrowRight size={14} />
                    </a>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openAuth('signup')}
                      className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <HeartHandshake size={18} />
                      <span>Become a Donor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuth('login')}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-300 shadow-xs transition-all hover:border-slate-400 cursor-pointer"
                    >
                      <span>Donor Sign In</span>
                    </button>
                    <a
                      href="#eligibility"
                      className="flex items-center justify-center gap-1.5 px-4 py-3.5 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors"
                    >
                      <span>Am I Eligible?</span>
                      <ArrowRight size={14} />
                    </a>
                  </>
                )}
              </div>

              {/* Micro-testimonial / Social Proof */}
              <div className="pt-2 flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                    AK
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                    VK
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                    PS
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                    +1k
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-900 font-semibold">1,240+ voluntary donors</strong> active across 45 partner hospitals today.
                </p>
              </div>
            </div>

            {/* Right Hero Image Column (Clean, simple, high-res visual inspired by reference image) */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md lg:max-w-none">
                {/* Visual Frame */}
                <div className="relative rounded-3xl overflow-hidden border border-rose-100/80 bg-white shadow-2xl shadow-rose-900/10 p-2 sm:p-3 transition-transform duration-300 hover:scale-[1.01]">
                  <img
                    src={heroBloodDonorImg}
                    alt="Voluntary blood donation connecting donor and recipient with heart tube"
                    className="w-full h-auto aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] object-cover rounded-2xl"
                    loading="eager"
                  />

                  {/* Floating Glassmorphism Badge (Top Right) */}
                  <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-md border border-rose-200/70 shadow-lg px-3.5 py-2 rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shadow-xs">
                      <HeartPulse size={15} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">World Blood Network</p>
                      <p className="text-xs font-black text-slate-900">Give Blood • Save Life</p>
                    </div>
                  </div>

                  {/* Floating Glassmorphism Badge (Bottom Left) */}
                  <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg px-3.5 py-2 rounded-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                      3x
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lifesaving Ratio</p>
                      <p className="text-xs font-black text-rose-700">1 Donation = 3 Lives Saved</p>
                    </div>
                  </div>
                </div>

                {/* Subtle caption */}
                <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                  Safe, voluntary donation connecting life-givers with patients in need.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KEY METRICS & LIVE IMPACT STRIP */}
      <section className="bg-white py-10 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-rose-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-3">
                <Droplets size={20} />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">10,000+</p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Units Collected</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Voluntary units safely banked</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-rose-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mb-3">
                <HeartHandshake size={20} />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">30,000+</p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Lives Saved</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Emergency & surgery transfusions</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-rose-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                <Building size={20} />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">45+</p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Accredited Centers</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Connected local blood banks</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-rose-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <Clock size={20} />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">&lt; 15 Mins</p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Emergency Dispatch</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Rapid donor GPS radius alerts</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE BLOOD GROUP COMPATIBILITY MATCHER */}
      <section id="compatibility" className="py-16 bg-slate-50/60 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              🩸 RBC Compatibility Matrix
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Know Your Blood Compatibility
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Select your blood group to see who can receive your red blood cells and which blood groups you can receive from in medical emergencies.
            </p>
          </div>

          {/* Blood Group Selector Tabs */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-8">
            {Object.keys(BLOOD_COMPATIBILITY).map((grp) => {
              const isSelected = selectedBloodGroup === grp;
              return (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedBloodGroup(grp)}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl text-sm font-black transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-105'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {grp}
                </button>
              );
            })}
          </div>

          {/* Interactive Compatibility Card */}
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-black text-2xl shadow-inner shrink-0">
                  {selectedBloodGroup}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-slate-900">{currentCompat.label}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentCompat.tagColor}`}>
                      {currentCompat.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Demand Status: <strong className="text-rose-700">{currentCompat.demand}</strong>
                  </p>
                </div>
              </div>

              {/* Action for selected group */}
              <button
                type="button"
                onClick={() => {
                  if (user && user.role === 'DONOR') {
                    navigate('/appointment');
                  } else {
                    openAuth('signup');
                  }
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer self-start sm:self-auto shrink-0"
              >
                Book Donation for {selectedBloodGroup}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-6">
              {/* Can Give Blood To */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                    ↗️
                  </span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      You Can Give Red Blood Cells To:
                    </h4>
                    <p className="text-[11px] text-slate-500">Compatible Recipient Groups</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {currentCompat.giveTo.map((target) => (
                    <span
                      key={target}
                      className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 font-extrabold text-xs shadow-xs"
                    >
                      🩸 {target}
                    </span>
                  ))}
                </div>
              </div>

              {/* Can Receive Blood From */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    ↘️
                  </span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      You Can Receive Red Blood Cells From:
                    </h4>
                    <p className="text-[11px] text-slate-500">Compatible Donor Groups</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {currentCompat.receiveFrom.map((src) => (
                    <span
                      key={src}
                      className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 font-extrabold text-xs shadow-xs"
                    >
                      ✓ {src}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Medical description */}
            <div className="mt-5 p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
              <Sparkles size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{currentCompat.description}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (4 SIMPLE STEPS) */}
      <section id="how-it-works" className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How Voluntary Donation Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              From fast online scheduling to your verified medical pass, saving a life takes just four comfortable steps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 relative hover:border-rose-300 transition-all">
              <span className="text-4xl font-black text-rose-600/20">01</span>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-rose-600 flex items-center justify-center my-3 shadow-xs">
                <User size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Register In 60 Seconds</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create your voluntary donor profile with contact phone, permanent location, and blood group.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 relative hover:border-rose-300 transition-all">
              <span className="text-4xl font-black text-rose-600/20">02</span>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-rose-600 flex items-center justify-center my-3 shadow-xs">
                <Calendar size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Pick Date & Hospital</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose an accredited center or blood bank nearby, selecting the 1-hour time slot that fits your schedule.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 relative hover:border-rose-300 transition-all">
              <span className="text-4xl font-black text-rose-600/20">03</span>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-rose-600 flex items-center justify-center my-3 shadow-xs">
                <HeartHandshake size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">15-Min Safe Donation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Relax on a cushioned recliner. Certified medical doctors handle the gentle collection with 100% sterile kits.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 relative hover:border-rose-300 transition-all">
              <span className="text-4xl font-black text-rose-600/20">04</span>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-rose-600 flex items-center justify-center my-3 shadow-xs">
                <Award size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Verified Report & Pass</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive SMS confirmation when your blood is delivered to a patient, plus your verified clinical lab report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE ELIGIBILITY CHECKER */}
      <section id="eligibility" className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Quick Self-Assessment
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Are You Eligible To Donate Blood?
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Most healthy adults can donate blood. Answer these 4 quick questions to see your eligibility right now.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Question 1 */}
              <div
                onClick={() => handleEligibilityToggle('age')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  eligibilityAnswers.age
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    eligibilityAnswers.age ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Check size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Are you between 18 and 65 years old?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Standard legal age for voluntary blood donation.</p>
                </div>
              </div>

              {/* Question 2 */}
              <div
                onClick={() => handleEligibilityToggle('weight')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  eligibilityAnswers.weight
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    eligibilityAnswers.weight ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Check size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Do you weigh 50 kg (110 lbs) or more?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Ensures your safe total blood volume capacity.</p>
                </div>
              </div>

              {/* Question 3 */}
              <div
                onClick={() => handleEligibilityToggle('health')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  eligibilityAnswers.health
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    eligibilityAnswers.health ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Check size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Are you feeling well and healthy today?</p>
                  <p className="text-xs text-slate-500 mt-0.5">No active flu, cold, sore throat, or active fever.</p>
                </div>
              </div>

              {/* Question 4 */}
              <div
                onClick={() => handleEligibilityToggle('interval')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  eligibilityAnswers.interval
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    eligibilityAnswers.interval ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Check size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Last donation was 90+ days ago (or first time)?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Allows complete natural red cell replenishment.</p>
                </div>
              </div>
            </div>

            {/* Instant Result Box */}
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isEligible ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {isEligible ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    {isEligible
                      ? '🎉 You meet the core criteria to donate blood today!'
                      : '⚠️ Please review the criteria above or speak with our physician.'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isEligible
                      ? 'Every unit you donate can save up to 3 trauma or surgery patients.'
                      : 'You may be temporarily deferred until rest, weight, or interval requirements are met.'}
                  </p>
                </div>
              </div>

              {isEligible && (
                <button
                  type="button"
                  onClick={() => {
                    if (user && user.role === 'DONOR') {
                      navigate('/appointment');
                    } else {
                      openAuth('signup');
                    }
                  }}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
                >
                  Schedule Your Donation Slot
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHY VOLUNTARY DONATION MATTERS (4 PILLARS) */}
      <section className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Life-Saving Impact
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why Voluntary Blood Donation Matters
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Blood cannot be manufactured synthetically in laboratories. Patients depend entirely on the generosity of voluntary donors like you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <HeartPulse size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Trauma & Accident Victims</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A single severe road trauma victim may require up to 50 units of blood in the first critical hour of emergency care.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <Activity size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Cancer & Chemotherapy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chemotherapy temporarily damages bone marrow. Cancer warriors depend on frequent red cell and platelet infusions to recover.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Free Donor Health Check</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every donor receives free clinical screening: blood pressure, pulse, hemoglobin levels, and blood group cross-match.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Radio size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Real-Time Hospital Radius</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When critical blood reserves deplete, our platform alerts eligible donors within a 5km to 15km radius via direct SMS and callouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. 24/7 EMERGENCY BLOOD HELPLINE BANNER */}
      <section className="py-4 sm:py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400">
                  24/7 Emergency Blood Desk
                </span>
                <span className="text-white/30 hidden sm:inline">•</span>
                <span className="text-xs text-slate-300 hidden md:inline">
                  Critical shortages broadcast emergency donor callouts directly
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight mt-0.5">
                Toll-Free Helpline: <span className="text-cyan-300 font-black">1800-266-3666</span>
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active 24/7 Nationwide</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Common Questions
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Everything you need to know about preparing for your voluntary blood donation.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/60 transition-colors"
                  >
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <HelpCircle size={16} className="text-rose-600 shrink-0" />
                      <span>{faq.q}</span>
                    </span>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/40 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                  <HeartPulse size={18} />
                </div>
                <span className="text-lg font-black text-white tracking-tight">Rakt - Blood Portal</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                India's voluntary donor network bridging emergency rooms, hospital blood banks, and caring donors in real-time.
              </p>
              <p className="text-[11px] text-slate-500">
                100% Non-Profit • Voluntary Lifesaving Initiative
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Quick Links</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#compatibility" className="hover:text-rose-400 transition-colors">
                    Blood Compatibility Matrix
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-rose-400 transition-colors">
                    How Donation Works
                  </a>
                </li>
                <li>
                  <a href="#eligibility" className="hover:text-rose-400 transition-colors">
                    Donor Eligibility Quiz
                  </a>
                </li>
                <li>
                  <Link to="/appointment" className="hover:text-rose-400 transition-colors">
                    Book Donation Slot
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Portals</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => openAuth('login')}
                    className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                  >
                    Voluntary Donor Login
                  </button>
                </li>
                <li>
                  <Link to="/hospital" className="hover:text-rose-400 transition-colors">
                    Hospital Staff Portal
                  </Link>
                </li>
                <li>
                  <Link to="/admin/login" className="hover:text-rose-400 transition-colors">
                    Administrative Console
                  </Link>
                </li>
                <li>
                  <Link to="/staff" className="hover:text-rose-400 transition-colors">
                    Staff Management
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">24/7 Helpline</h4>
              <p className="text-xs text-slate-300 font-bold">1800-266-3666</p>
              <p className="text-xs text-slate-500 mt-1">emergency@rakt-network.org</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>All Systems Operational</span>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <p>© {new Date().getFullYear()} Rakt Voluntary Blood Network. All rights reserved.</p>
            <p>Designed for public health and rapid life-saving transfusions.</p>
          </div>
        </div>
      </footer>

      {/* 11. GUEST AUTH POPUP MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
            <DonorAuth
              onLoginSuccess={(userData) => {
                setAuthModalOpen(false);
                if (onLoginSuccess) {
                  onLoginSuccess(userData);
                }
              }}
              initialMode={authMode}
              onCancel={() => setAuthModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 12. MEDICAL LAB REPORT MODAL */}
      <MedicalReportModal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
      />
    </div>
  );
}
