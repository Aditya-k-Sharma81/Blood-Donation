import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { Droplet, Heart, MapPin, Bell, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function DonorDashboard() {
  const [donorData, setDonorData] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [activeRequests, setActiveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', isError: false });

  useEffect(() => {
    fetchDonorData();
  }, []);

  const fetchDonorData = async () => {
    try {
      setLoading(true);
      const res = await API.get('/donor/profile');
      if (res.data.success) {
        setDonorData(res.data.donor);
        setEligibility(res.data.eligibility);
        setActiveRequests(res.data.activeRequests || []);
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to fetch donor details', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const res = await API.put('/donor/availability');
      if (res.data.success) {
        setDonorData((prev) => ({ ...prev, isAvailable: res.data.isAvailable }));
        setMsg({ text: res.data.message, isError: false });
      }
    } catch (err) {
      setMsg({ text: 'Failed to update availability status', isError: true });
    }
  };

  const handleRespondToRequest = async (requestId) => {
    try {
      const res = await API.post('/donor/respond-request', { requestId });
      if (res.data.success) {
        setMsg({ text: res.data.message, isError: false });
        fetchDonorData();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to record response', isError: true });
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-73px)] flex flex-col items-center justify-center text-slate-400">
        <div className="pulse-dot mb-3 w-4 h-4" />
        Checking 90-day donor eligibility & live emergency dispatches...
      </div>
    );
  }

  const hospitalLat = 30.901;
  const hospitalLng = 75.857;
  const donorLat = donorData?.location?.lat || 30.908;
  const donorLng = donorData?.location?.lng || 75.852;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/15 border border-rose-500/30 px-3 py-1 rounded-full">
            <Heart size={14} className="fill-rose-400" /> Voluntary Donor Portal
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Welcome, {donorData?.userId?.name || 'Voluntary Donor'}</h1>
          <p className="text-xs text-slate-400">
            Blood Group: <strong className="text-rose-500 text-sm">{donorData?.bloodGroup}</strong> | City: {donorData?.userId?.city || 'City Central'}
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="glass-card p-3 flex items-center gap-4">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Status Toggle</div>
            <div className="text-xs font-bold text-white">
              {donorData?.isAvailable ? 'Available 🟢' : 'Busy 🔴'}
            </div>
          </div>
          <button
            onClick={handleToggleAvailability}
            className={`btn text-xs py-2 px-3 ${donorData?.isAvailable ? 'btn-amber' : 'btn-emerald'}`}
          >
            Switch to {donorData?.isAvailable ? 'Busy 🔴' : 'Available 🟢'}
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${msg.isError ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'}`}>
          {msg.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {msg.text}
        </div>
      )}

      {/* 🤖 AUTOMATED 90-DAY ELIGIBILITY INVITATION WIDGET */}
      <div className={`glass-card p-6 border ${
        eligibility?.isEligible ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-amber-500/10 border-amber-500/40'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl text-white ${eligibility?.isEligible ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-amber-500 shadow-lg shadow-amber-500/30'}`}>
              {eligibility?.isEligible ? <CheckCircle2 size={32} /> : <Clock size={32} />}
            </div>
            <div>
              <div className={`text-xs font-bold uppercase tracking-wider ${eligibility?.isEligible ? 'text-emerald-400' : 'text-amber-300'}`}>
                🤖 Automated 90-Day Recovery Status
              </div>
              <h3 className="text-xl font-black text-white my-1">
                {eligibility?.isEligible ? '🎉 ELIGIBLE TO DONATE NOW! 🟢' : `⏳ Recovery Countdown: ${eligibility?.daysRemaining} Days Remaining`}
              </h3>
              <p className="text-xs text-slate-300">
                {eligibility?.autoInvitationMsg}
              </p>
            </div>
          </div>

          {eligibility?.isEligible && (
            <button
              onClick={() => handleRespondToRequest(activeRequests[0]?.requestId || 'SCHEDULE_VISIT')}
              className="btn btn-emerald py-3 px-6 text-sm"
            >
              🩸 Schedule Donation at Central Hospital
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Active Emergency Dispatches */}
        <div className="col-span-7 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Bell size={18} className="text-rose-500" /> Emergency Hospital Dispatches
            </h3>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
              <span className="pulse-dot" /> Live Alerts
            </span>
          </div>

          {activeRequests.length === 0 ? (
            <div className="text-slate-400 text-xs p-6 text-center">
              No emergency dispatches currently requested for your blood group.
            </div>
          ) : (
            <div className="space-y-3">
              {activeRequests.map((req) => (
                <div key={req._id} className="glass-card p-4 bg-slate-900/60 border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded">
                      {req.urgency} ICU ALERT
                    </span>
                    <span className="text-xs text-slate-500">{req.requestId}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-rose-500 mb-1">
                    🚨 City Central Hospital needs {req.bloodGroup} Blood
                  </h4>
                  <div className="text-xs text-slate-400 mb-3">
                    Units Needed: <strong className="text-white">{req.unitsRequired} Units</strong> | Distance: <strong className="text-white">3.2 km</strong>
                  </div>

                  <button
                    onClick={() => handleRespondToRequest(req.requestId)}
                    className="btn btn-primary w-full py-2.5 text-xs"
                  >
                    🩸 I'm Available to Donate at Hospital
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="col-span-5 glass-card p-5 flex flex-col">
          <h3 className="text-base font-extrabold text-white mb-1 flex items-center gap-2">
            <MapPin size={18} className="text-emerald-400" /> Central Hospital Location
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            🟢 City Central Hospital Node (Distance: 3.2 km)
          </p>

          <div className="flex-1 min-h-[260px] rounded-xl overflow-hidden">
            <MapContainer center={[hospitalLat, hospitalLng]} zoom={13} scrollWheelZoom={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[hospitalLat, hospitalLng]}>
                <Popup>
                  <strong>🏥 City Central Hospital & Blood Bank</strong><br />
                  124 Healthcare Avenue
                </Popup>
              </Marker>
              <Marker position={[donorLat, donorLng]}>
                <Popup>
                  <strong>🩸 Your Location (Voluntary Donor)</strong>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
