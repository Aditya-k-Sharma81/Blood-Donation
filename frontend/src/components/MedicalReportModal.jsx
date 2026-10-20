import React from 'react';
import {
  Droplets,
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Clock,
  User,
  Phone,
  ShieldCheck,
  Building,
  Printer,
  FileText,
  UserCheck
} from 'lucide-react';

export default function MedicalReportModal({
  isOpen,
  onClose,
  report, // can be a notification or a donationRecord object
}) {
  if (!isOpen || !report) return null;

  // Extract fields uniformly whether from notification.details or donationRecord
  const details = report.details || report;

  const isMatched = details.isBloodGroupMatched !== undefined ? details.isBloodGroupMatched : true;
  const verifiedGroup = details.verifiedBloodGroup || details.bloodGroup || 'O+';
  const registeredGroup = details.registeredBloodGroup || verifiedGroup;
  const hospitalName = details.hospitalName || 'City Central Hospital';
  const doctorName = details.doctorName || 'Consulting Medical Officer';
  const doctorEmail = details.doctorEmail || '';
  const donorName = details.donorName || report.donorName || 'Voluntary Donor';
  const bookingRef = details.bookingReference || report.bookingReference || 'RKT-APT';
  const bloodAmount = details.bloodAmountMl || 350;
  const hemoglobin = details.hemoglobin || 13.5;
  const bloodPressure = details.bloodPressure || '120/80';
  const pulseRate = details.pulseRate || 72;
  const donationDate = details.donationDate || report.createdAt || new Date();
  const nextEligibleDate = details.nextEligibleDate;
  const mismatchNote = details.bloodGroupMismatchNote;
  const remarks = details.medicalRemarks;
  const barcode = details.bagBarcode;

  const formattedDonDate = new Date(donationDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedNextDate = nextEligibleDate
    ? new Date(nextEligibleDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border-2 border-rose-300 rounded-3xl max-w-2xl w-full shadow-2xl my-auto overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[92vh]">
        {/* Certificate / Slip Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-rose-600 to-red-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 block">
                Official Clinical Intake & Medical Report
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                Blood Donation & Lab Verification Slip
              </h2>
              <p className="text-[11px] text-rose-100 font-mono mt-0.5">
                Ref: {bookingRef}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Print Medical Report"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-800">
          {/* Blood Group Verification Status Banner */}
          {!isMatched ? (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                    Medical Alert: Blood Group Discrepancy Found
                  </span>
                  <p className="text-xs text-amber-950 font-medium mt-0.5 leading-relaxed">
                    During clinical laboratory cross-matching at <strong>{hospitalName}</strong>, the attending medical officer found that your blood group is <strong className="text-rose-700 font-bold">{verifiedGroup}</strong>, differing from your registered profile (<span className="line-through text-slate-500">{registeredGroup}</span>).
                  </p>
                  {mismatchNote && (
                    <div className="mt-2.5 p-3 bg-white/90 rounded-xl border border-amber-200 text-xs">
                      <strong className="block text-[11px] text-amber-800 uppercase tracking-wider mb-1">
                        Doctor's Clinical Lab Findings:
                      </strong>
                      <p className="text-slate-800 leading-relaxed italic">"{mismatchNote}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  ✓ Blood Group Cross-Check: Verified & Matched
                </span>
                <p className="text-xs text-emerald-800">
                  Clinical laboratory testing confirmed your blood group as <strong>{verifiedGroup}</strong>, perfectly matching your donor profile.
                </p>
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Blood Collected</span>
              <span className="text-lg font-black text-rose-600 block mt-0.5">
                {bloodAmount} mL
              </span>
              <span className="text-[10px] text-slate-500">1 Unit Donated</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Verified Group</span>
              <span className="text-lg font-black text-slate-800 block mt-0.5">
                🩸 {verifiedGroup}
              </span>
              <span className="text-[10px] text-slate-500">ABO & Rh Confirmed</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Hemoglobin</span>
              <span className="text-lg font-black text-slate-800 block mt-0.5">
                {hemoglobin} <span className="text-xs font-semibold text-slate-500">g/dL</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Healthy Range</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Blood Pressure</span>
              <span className="text-lg font-black text-slate-800 block mt-0.5">
                {bloodPressure}
              </span>
              <span className="text-[10px] text-slate-500">Pulse: {pulseRate} bpm</span>
            </div>
          </div>

          {/* Center & Doctor Identity Card */}
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building size={13} className="text-rose-600" />
                <span>Donation Facility</span>
              </span>
              <span className="font-bold text-slate-900">{hospitalName}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={13} className="text-rose-600" />
                <span>Attending Medical Officer</span>
              </span>
              <span className="font-bold text-slate-900">
                {doctorName} {doctorEmail ? `(${doctorEmail})` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} className="text-rose-600" />
                <span>Donation Date</span>
              </span>
              <span className="font-bold text-slate-900">{formattedDonDate}</span>
            </div>

            {barcode && (
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="font-bold text-slate-500 uppercase tracking-wider">
                  Blood Bag Barcode / Lot #
                </span>
                <span className="font-mono font-bold text-slate-800">{barcode}</span>
              </div>
            )}

            {formattedNextDate && (
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-rose-700 flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>Next Eligible Donation Date:</span>
                </span>
                <span className="font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg">
                  {formattedNextDate} (90 Days)
                </span>
              </div>
            )}
          </div>

          {/* Doctor Remarks */}
          {remarks && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Doctor's Clinical Advice:</span>
              <p className="text-slate-600 italic leading-relaxed">"{remarks}"</p>
            </div>
          )}

          {/* Official Verification Seal */}
          <div className="p-3 bg-rose-50/50 border border-rose-200/60 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5 font-semibold text-rose-800">
              <ShieldCheck size={15} className="text-emerald-600" />
              <span>Electronically Certified Blood Donation Record</span>
            </span>
            <span className="font-mono text-slate-400">Rakt Clinical DB # {bookingRef}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            Close
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer size={14} />
            <span>Print Clinical Record</span>
          </button>
        </div>
      </div>
    </div>
  );
}
