import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { Building2, AlertTriangle, Send, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function HospitalDashboard() {
  const [hospital, setHospital] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Dispatch form state
  const [dispatchForm, setDispatchForm] = useState({
    bloodGroup: 'O-',
    unitsRequired: 3,
    urgency: 'CRITICAL',
  });
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    fetchHospitalData();
  }, []);

  const fetchHospitalData = async () => {
    try {
      setLoading(true);
      const [profRes, reqRes] = await Promise.all([
        API.get('/hospital/profile'),
        API.get('/hospital/requests'),
      ]);
      if (profRes.data.success) setHospital(profRes.data.hospital);
      if (reqRes.data.success) setRequests(reqRes.data.requests);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to load hospital profile', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (bloodGroup, currentUnits, delta) => {
    const newUnits = Math.max(0, currentUnits + delta);
    try {
      const res = await API.put('/hospital/inventory', { bloodGroup, units: newUnits });
      if (res.data.success) {
        setHospital((prev) => ({
          ...prev,
          inventory: res.data.inventory,
        }));
      }
    } catch (err) {
      setMsg({ text: 'Stock update failed', isError: true });
    }
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setDispatching(true);
    setMsg({ text: '', isError: false });

    try {
      const res = await API.post('/hospital/request-dispatch', dispatchForm);
      if (res.data.success) {
        setMsg({ text: res.data.message, isError: false });
        fetchHospitalData();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Dispatch failed', isError: true });
    } finally {
      setDispatching(false);
    }
  };

  const handleVerifyCollection = async (requestId, donorId, bloodGroup) => {
    try {
      const res = await API.post('/hospital/verify-collection', { requestId, donorId, bloodGroup });
      if (res.data.success) {
        setMsg({ text: res.data.message, isError: false });
        fetchHospitalData();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Verification failed', isError: true });
    }
  };

  const getStockStatusBadge = (units) => {
    if (units > 15) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">Sufficient ({units}u)</span>;
    if (units >= 5) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30">Low ({units}u)</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30"><span className="pulse-dot" /> Critical ({units}u)</span>;
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-73px)] flex flex-col items-center justify-center text-slate-400">
        <div className="pulse-dot mb-3 w-4 h-4" />
        Loading Central Blood Bank Inventory & Dispatches...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-73px)] overflow-hidden p-6 max-w-7xl mx-auto flex flex-col justify-between space-y-4">
      
      {/* Header & Alerts */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/15 border border-blue-500/30 px-3 py-0.5 rounded-full">
              <Building2 size={14} /> Medical Staff Portal
            </span>
            <h1 className="text-2xl font-black text-white mt-1">{hospital?.hospitalName || 'City Central Hospital'}</h1>
          </div>
          <div className="text-right text-xs text-slate-400">
            License: <span className="text-slate-200 font-semibold">{hospital?.licenseNumber}</span>
          </div>
        </div>

        {msg.text && (
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${msg.isError ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'}`}>
            {msg.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {msg.text}
          </div>
        )}
      </div>

      {/* 8-Group Stock Visualizer */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-white">Live 8-Group Stock Visualizer</h3>
          <span className="text-[11px] text-slate-400">Click + / - to adjust real-time reserves</span>
        </div>

        <div className="grid grid-cols-8 gap-3">
          {hospital?.inventory?.map((item) => (
            <div
              key={item.bloodGroup}
              className={`p-3 rounded-xl border transition-all ${
                item.units < 5
                  ? 'bg-rose-500/10 border-rose-500/40'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-black text-rose-500">{item.bloodGroup}</span>
              </div>
              <div className="mb-2">{getStockStatusBadge(item.units)}</div>
              <div className="flex items-center justify-between bg-slate-950/60 rounded-lg p-1">
                <button
                  onClick={() => handleUpdateStock(item.bloodGroup, item.units, -1)}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-xs font-bold text-white">{item.units}</span>
                <button
                  onClick={() => handleUpdateStock(item.bloodGroup, item.units, 1)}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Emergency Dispatcher (Left) & Active Dispatches List (Right) */}
      <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Left: Dispatch Form */}
        <div className="col-span-5 glass-card p-5 border-rose-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={20} className="text-rose-500" />
              <h3 className="text-base font-extrabold text-white">Dispatch Emergency Blood Request</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Broadcasts via RBC algorithm to matching voluntary donors in city radius.
            </p>

            <form onSubmit={handleDispatchSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Blood Group Needed
                </label>
                <select
                  className="input-field text-xs py-2 bg-slate-900"
                  value={dispatchForm.bloodGroup}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, bloodGroup: e.target.value })}
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                    <option key={bg} value={bg} className="bg-slate-900">
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Units Required
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="input-field text-xs py-2"
                  value={dispatchForm.unitsRequired}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, unitsRequired: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Urgency Level
                </label>
                <select
                  className="input-field text-xs py-2 bg-slate-900"
                  value={dispatchForm.urgency}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, urgency: e.target.value })}
                >
                  <option value="NORMAL" className="bg-slate-900">Normal</option>
                  <option value="URGENT" className="bg-slate-900">Urgent</option>
                  <option value="CRITICAL" className="bg-slate-900">● Critical ICU Emergency</option>
                </select>
              </div>

              <button type="submit" disabled={dispatching} className="btn btn-primary w-full py-2.5 text-xs mt-2">
                <Send size={15} /> {dispatching ? 'Broadcasting Alert...' : 'Dispatch Emergency Request 🚨'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active Emergency Dispatches */}
        <div className="col-span-7 glass-card p-5 flex flex-col min-h-0">
          <h3 className="text-base font-extrabold text-white mb-3">Active Hospital Dispatches & Arriving Donors</h3>

          {requests.length === 0 ? (
            <div className="text-slate-400 text-xs p-6 text-center">
              No active emergency dispatches currently.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {requests.map((req) => (
                <div key={req._id} className="glass-card p-3.5 bg-slate-900/60 border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-md">
                        {req.requestId}
                      </span>
                      <strong className="text-sm font-extrabold text-rose-500">{req.bloodGroup}</strong>
                      <span className="text-xs text-slate-400">({req.unitsFulfilled}/{req.unitsRequired} Units Arranged)</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      req.status === 'FULFILLED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  {req.respondedDonors && req.respondedDonors.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      {req.respondedDonors.map((rd) => (
                        <div key={rd.donorId?._id || rd._id} className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg text-xs">
                          <div>
                            <span className="font-semibold text-slate-200">{rd.donorId?.userId?.name || 'Voluntary Donor'}</span>
                            <span className="text-[11px] text-slate-400 ml-2">({rd.donorId?.userId?.phone || 'Contact available'})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              rd.status === 'COLLECTED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {rd.status}
                            </span>
                            {rd.status !== 'COLLECTED' && (
                              <button
                                onClick={() => handleVerifyCollection(req.requestId, rd.donorId._id, req.bloodGroup)}
                                className="btn btn-emerald text-[11px] py-1 px-2.5"
                              >
                                <UserCheck size={13} /> Verify & Collect 🛡️
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic mt-1">
                      Awaiting response from compatible voluntary donors...
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
