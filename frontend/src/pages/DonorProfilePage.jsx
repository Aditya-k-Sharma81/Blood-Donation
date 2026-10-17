import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Droplets,
  MapPin,
  Home,
  Building,
  Navigation,
  HeartPulse,
  Lock,
  Camera,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// Safe helper for formatting date strings for <input type="date" />
const safeDateString = (val) => {
  if (!val) return '';
  try {
    const str = String(val).trim();
    if (str.includes('T')) return str.split('T')[0];
    if (str.length >= 10 && str[4] === '-' && str[7] === '-') return str.slice(0, 10);
    const d = new Date(val);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

export default function DonorProfilePage({ user, onUserUpdate }) {
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bloodGroup: user?.bloodGroup || '',
    lastLocation: user?.lastLocation || user?.currentLocation || '',
    permanentLocation: user?.permanentLocation || user?.address || '',
    city: user?.city || '',
    address: user?.address || user?.permanentLocation || '',
    latitude: user?.latitude || null,
    longitude: user?.longitude || null,
    profilePic: user?.profilePic || '',
    gender: user?.gender || '',
    dateOfBirth: safeDateString(user?.dateOfBirth),
    age: user?.age || '',
    weight: user?.weight || '',
    emergencyContact: user?.emergencyContact || '',
    lastDonationDate: safeDateString(user?.lastDonationDate),
    isAvailable: user?.isAvailable !== false,
  });

  const [initialBloodGroup, setInitialBloodGroup] = useState(user?.bloodGroup || '');
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isProfileSet, setIsProfileSet] = useState(Boolean(user?.isProfileSet));

  // Sync profile once on mount
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchProfile = async () => {
      try {
        setFetching(true);
        const headers = {
          'x-user-id': user?.id || user?._id || '',
          'x-donor-id': user?.id || user?._id || '',
          'x-user-email': user?.email || '',
        };
        if (user?.token) {
          headers['Authorization'] = `Bearer ${user.token}`;
        }

        const res = await fetch('/api/donor/profile', { headers });
        const data = await res.json();

        if (res.ok && data.success && data.donor) {
          const d = data.donor;
          setFormData({
            name: d.name || '',
            email: d.email || '',
            phone: d.phone || '',
            bloodGroup: d.bloodGroup || '',
            lastLocation: d.lastLocation || d.currentLocation || '',
            permanentLocation: d.permanentLocation || d.address || '',
            city: d.city || '',
            address: d.address || d.permanentLocation || '',
            latitude: d.latitude !== undefined && d.latitude !== null ? d.latitude : null,
            longitude: d.longitude !== undefined && d.longitude !== null ? d.longitude : null,
            profilePic: d.profilePic || '',
            gender: d.gender || '',
            dateOfBirth: safeDateString(d.dateOfBirth),
            age: d.age || '',
            weight: d.weight || '',
            emergencyContact: d.emergencyContact || '',
            lastDonationDate: safeDateString(d.lastDonationDate),
            isAvailable: d.isAvailable !== false,
          });

          if (d.bloodGroup) {
            setInitialBloodGroup(d.bloodGroup);
          }
          setIsProfileSet(Boolean(d.isProfileSet));
        }
      } catch (err) {
        console.warn('Could not fetch donor profile:', err);
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [user?.id, user?._id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Auto-calculate age from dateOfBirth
  const handleDobChange = (e) => {
    const dobValue = e.target.value;
    let calculatedAge = formData.age;
    if (dobValue) {
      try {
        const birthDate = new Date(dobValue);
        const diff = Date.now() - birthDate.getTime();
        const ageDate = new Date(diff);
        calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
      } catch (err) { }
    }
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: dobValue,
      age: calculatedAge,
    }));
  };

  // Upload Avatar
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File',
        text: 'Please select an image file (JPG, PNG, WebP).',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'File Too Large',
        text: 'Please select an image smaller than 8MB.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || user?._id || '',
        };
        if (user?.token) {
          headers['Authorization'] = `Bearer ${user.token}`;
        }

        const res = await fetch('/api/donor/upload-profile-pic', {
          method: 'POST',
          headers,
          body: JSON.stringify({ base64: reader.result }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to upload photo');
        }

        setFormData((prev) => ({ ...prev, profilePic: data.url }));

        if (onUserUpdate) {
          onUserUpdate({
            ...user,
            profilePic: data.url,
          });
        }

        Swal.fire({
          icon: 'success',
          title: 'Photo Updated',
          text: 'Profile photo has been saved successfully.',
          timer: 1500,
          showConfirmButton: false,
          iconColor: '#10b981',
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: err.message,
          confirmButtonColor: '#e11d48',
        });
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Auto-detect GPS Current Location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: 'warning',
        title: 'Geolocation Not Supported',
        text: 'Your browser does not support automatic location detection.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const geoData = await geoRes.json();

          if (geoData && geoData.display_name) {
            const cityName =
              geoData.address?.city ||
              geoData.address?.town ||
              geoData.address?.state_district ||
              geoData.address?.state ||
              '';

            setFormData((prev) => ({
              ...prev,
              lastLocation: geoData.display_name,
              city: prev.city || cityName,
            }));

            Swal.fire({
              icon: 'success',
              title: 'Location Detected!',
              text: `Position: ${cityName || geoData.display_name.slice(0, 45)}`,
              timer: 1800,
              showConfirmButton: false,
              iconColor: '#10b981',
            });
          }
        } catch (e) {
          console.warn('Reverse geocoding error:', e);
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        Swal.fire({
          icon: 'error',
          title: 'Location Detection Failed',
          text: 'Please allow browser location permissions or type location manually.',
          confirmButtonColor: '#e11d48',
        });
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Name Required',
        text: 'Please enter your full name.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    if (!formData.phone?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Phone Number Required',
        text: 'Please provide a contact number for urgent blood requests.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    if (!formData.bloodGroup?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Blood Group Required',
        text: 'Please select your blood group.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    setLoading(true);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || user?._id || '',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const res = await fetch('/api/donor/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ...formData,
          phone: formData.phone.trim(),
          name: formData.name.trim(),
          lastLocation: (formData.lastLocation || '').trim(),
          permanentLocation: formData.permanentLocation.trim(),
          city: formData.city.trim(),
          emergencyContact: formData.emergencyContact.trim(),
          age: formData.age ? Number(formData.age) : null,
          weight: formData.weight ? Number(formData.weight) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update donor profile');
      }

      setLoading(false);
      setIsProfileSet(true);
      if (formData.bloodGroup) {
        setInitialBloodGroup(formData.bloodGroup);
      }

      const updatedUser = {
        ...user,
        ...data.donor,
        isProfileSet: true,
        token: data.token || user?.token,
      };

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      Swal.fire({
        icon: 'success',
        title: isProfileSet ? 'Profile Updated' : 'Profile Saved Successfully',
        text: 'Your voluntary donor credentials and location details have been saved.',
        timer: 1800,
        showConfirmButton: false,
        iconColor: '#10b981',
      });
    } catch (err) {
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.message,
        confirmButtonColor: '#e11d48',
      });
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-rose-600 mb-3" />
        <p className="text-sm font-medium">Loading Donor Profile...</p>
      </div>
    );
  }

  // Once a donor has a blood group saved, it is permanently locked/read-only
  const isBloodGroupLocked = Boolean(initialBloodGroup);

  return (
    <div className="w-full max-w-2xl my-6 self-start">
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden transition-all">
        {/* Top Banner */}
        <div className="h-28 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 px-6 py-4 flex justify-between items-start text-white">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all cursor-pointer text-white shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>

          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md text-rose-200 border border-white/10">
            Voluntary Donor
          </span>
        </div>

        {/* Profile Card Header with Avatar */}
        <div className="px-8 pb-6 relative">
          <div className="flex items-end gap-5 -mt-12 mb-6">
            {/* Interactive Avatar */}
            <label
              htmlFor="profile-pic-upload"
              className="relative group/avatar cursor-pointer block shrink-0"
              title="Click to change photo"
            >
              <div className="relative w-24 h-24 rounded-2xl ring-4 ring-white shadow-md overflow-hidden bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white text-2xl font-black">
                {formData.profilePic ? (
                  <img
                    src={formData.profilePic}
                    alt={formData.name || 'Donor'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{(formData.name || formData.email || 'D')[0].toUpperCase()}</span>
                )}

                {/* Hover overlay with camera */}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1 text-center">
                  <Camera size={20} className="mb-0.5 text-white" />
                  <span className="text-[9px] font-bold">Change</span>
                </div>

                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                    <RefreshCw className="w-6 h-6 animate-spin text-rose-400 mb-1" />
                    <span className="text-[9px] font-bold">Uploading...</span>
                  </div>
                )}
              </div>

              {/* Camera icon pill */}
              <div
                className="absolute -bottom-1 -right-1 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow transition-transform group-hover/avatar:scale-110 flex items-center justify-center ring-2 ring-white"
                title="Change photo"
              >
                <Camera size={13} />
              </div>

              <input
                id="profile-pic-upload"
                type="file"
                accept="image/*"
                disabled={uploadingPhoto}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Profile User Info */}
            <div className="pb-1">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {formData.name || 'Voluntary Donor'}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Mail size={13} className="text-rose-600" />
                <span>{formData.email}</span>
              </p>
              {formData.bloodGroup && (
                <p className="text-xs font-bold text-red-700 flex items-center gap-1.5 mt-1 bg-red-50 px-2.5 py-0.5 rounded-md w-fit border border-red-200">
                  <Droplets size={12} className="text-red-600 fill-red-600/20" />
                  <span>Blood Group: {formData.bloodGroup}</span>
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">

            {/* SECTION 1: Personal Credentials & Blood Group */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                <User className="w-4 h-4 text-rose-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Personal Credentials & Blood Type
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Rahul Sharma"
                      className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl text-slate-900 text-xs pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium shadow-xs"
                      required
                    />
                  </div>
                </div>

                {/* Email Address (Read-only) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Email Address
                    </label>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock size={10} /> Read-only
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs pl-10 pr-3.5 py-2.5 outline-none font-medium cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl text-slate-900 text-xs pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium shadow-xs"
                      required
                    />
                  </div>
                </div>

                {/* Blood Group (Read-only permanent biological identifier) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Blood Group
                    </label>
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Lock size={10} /> Permanent (Read-only)
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <Droplets className="absolute left-3.5 w-4 h-4 text-red-600" />
                    {isBloodGroupLocked && formData.bloodGroup ? (
                      <input
                        type="text"
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        readOnly
                        title="Blood group is a permanent biological identifier and cannot be modified once set."
                        className="w-full bg-red-50/70 border border-red-200 rounded-xl text-red-800 text-xs pl-10 pr-9 py-2.5 outline-none font-bold cursor-not-allowed select-none"
                      />
                    ) : (
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        required
                        className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl text-slate-900 text-xs pl-10 pr-3.5 py-2.5 outline-none font-bold shadow-xs cursor-pointer"
                      >
                        <option value="">Select Blood Group (Set Once)</option>
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    )}
                    <Lock className="absolute right-3.5 w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Used for automated RBC compatibility matching during emergency hospital requests.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 2: Location Details (Current Location & Permanent Location) */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Location & Geographical Residence
                  </h2>
                </div>

                {/* Auto-detect GPS button */}
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Detect GPS coordinates using browser geolocation"
                >
                  <Navigation size={12} className={detectingLocation ? 'animate-spin' : ''} />
                  <span>{detectingLocation ? 'Detecting...' : 'Auto-detect Location'}</span>
                </button>
              </div>

              <div className="space-y-3.5">
                {/* Current Location (Where donor currently resides or works) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Last Location
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Used for emergency hospital distance calculation
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="lastLocation"
                      value={formData.lastLocation}
                      onChange={handleChange}
                      placeholder="e.g. Sector 18, Noida / Connaught Place, New Delhi"
                      className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl text-slate-900 text-xs pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium shadow-xs"
                    />
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1.5 flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Background GPS active: Automatically saves your last location every 5 minutes.</span>
                  </p>
                </div>

                {/* Permanent Location (Home town / permanent address) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Permanent Location
                  </label>
                  <div className="relative flex items-center">
                    <Home className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="permanentLocation"
                      value={formData.permanentLocation}
                      onChange={handleChange}
                      placeholder="e.g. Civil Lines, Jaipur, Rajasthan"
                      className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl text-slate-900 text-xs pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      City / District
                    </label>
                    <div className="relative flex items-center">
                      <Building className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="New Delhi"
                        className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl text-slate-900 text-xs pl-10 pr-3.5 py-2.5 outline-none font-medium shadow-xs"
                      />
                    </div>
                  </div>

                  {/* GPS Coordinates Chip (if detected) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      GPS Coordinates
                    </label>
                    <div className="h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 font-mono">
                      <span>
                        {formData.latitude !== null && formData.longitude !== null
                          ? `${formData.latitude}, ${formData.longitude}`
                          : 'Not detected yet'}
                      </span>
                      {formData.latitude !== null && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Clinical & Blood Donation Eligibility Details */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Donor Health & Donation Eligibility
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl text-slate-900 text-xs px-3 py-2.5 outline-none font-medium shadow-xs cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleDobChange}
                    className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl text-slate-900 text-xs px-3 py-2 outline-none font-medium shadow-xs"
                  />
                  {formData.age ? (
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Age: <strong>{formData.age} years</strong>
                    </span>
                  ) : null}
                </div>

                {/* Weight (kg) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Body Weight (kg)
                    </label>
                    <span className="text-[10px] text-slate-400">Min 50kg</span>
                  </div>
                  <input
                    type="number"
                    min="30"
                    max="200"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g. 65"
                    className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl text-slate-900 text-xs px-3 py-2.5 outline-none font-medium shadow-xs"
                  />
                  {formData.weight && Number(formData.weight) >= 50 && (
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                      ✓ Eligible (&gt; 50kg)
                    </span>
                  )}
                </div>

                {/* Last Donation Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Last Blood Donation Date
                  </label>
                  <input
                    type="date"
                    name="lastDonationDate"
                    value={formData.lastDonationDate}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl text-slate-900 text-xs px-3 py-2 outline-none font-medium shadow-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Used to calculate 90-day recovery cycle
                  </span>
                </div>

                {/* Emergency Contact */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Emergency Contact / Alternate Phone
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    placeholder="e.g. Brother: +91 98111 22233"
                    className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl text-slate-900 text-xs px-3.5 py-2.5 outline-none font-medium shadow-xs placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Emergency Availability Toggle */}
              <div className="pt-2 border-t border-slate-200/60">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleChange}
                    className="w-4 h-4 text-rose-600 rounded-md border-slate-300 focus:ring-rose-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Active for Emergency ICU Callouts
                    </span>
                    <span className="text-[11px] text-slate-500">
                      When enabled, nearby hospitals can broadcast critical blood matching requests to you.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Save Donor Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
