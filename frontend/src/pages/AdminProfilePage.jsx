import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  ShieldCheck,
  Save,
  ArrowLeft,
  RefreshCw,
  Camera,
  Building2,
  Award,
  PhoneCall,
  Navigation,
  Crosshair,
  CheckCircle2,
  X,
  Lock
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminProfilePage({ user, onUserUpdate }) {
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);

  // Form state according to Admin schema including hospital details & coordinates
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || '',
    address: user?.address || '',
    profilePic: user?.profilePic || '',
    role: user?.role || 'ADMIN',
    // Hospital & Essential Credentials
    hospitalName: user?.hospitalName || '',
    licenseNumber: user?.licenseNumber || '',
    emergencyContact: user?.emergencyContact || '',
    // Geographic Location
    locationName: user?.locationName || '',
    latitude: user?.latitude !== undefined && user?.latitude !== null ? user.latitude : null,
    longitude: user?.longitude !== undefined && user?.longitude !== null ? user.longitude : null,
  });

  const [isProfileSet, setIsProfileSet] = useState(() => {
    return Boolean(
      user?.isProfileSet ||
      (user?.phone?.trim() && user?.city?.trim() && user?.address?.trim()) ||
      user?.hospitalName?.trim()
    );
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingCloudinary, setUploadingCloudinary] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Fetch admin profile details on mount
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/admin/login', { replace: true });
      return;
    }

    if (hasFetchedRef.current) {
      setFetching(false);
      return;
    }
    hasFetchedRef.current = true;

    const fetchProfile = async () => {
      try {
        setFetching(true);
        const headers = {
          'Content-Type': 'application/json',
          'x-admin-id': user.id || user._id || '',
          'x-admin-email': user.email || '',
        };
        if (user.token) {
          headers['Authorization'] = `Bearer ${user.token}`;
        }

        const res = await fetch('/api/admin/profile', { headers });
        const data = await res.json();

        if (res.ok && data.success && data.admin) {
          const profileAlreadySet = Boolean(
            data.admin.isProfileSet !== undefined
              ? data.admin.isProfileSet
              : ((data.admin.phone?.trim() && data.admin.city?.trim() && data.admin.address?.trim()) || data.admin.hospitalName?.trim())
          );
          setIsProfileSet(profileAlreadySet);

          setFormData((prev) => ({
            ...prev,
            name: data.admin.name || prev.name,
            email: data.admin.email || prev.email,
            phone: data.admin.phone || prev.phone,
            city: data.admin.city || prev.city,
            address: data.admin.address || prev.address,
            profilePic: data.admin.profilePic || prev.profilePic,
            role: data.admin.role || 'ADMIN',
            hospitalName: data.admin.hospitalName || prev.hospitalName,
            licenseNumber: data.admin.licenseNumber || prev.licenseNumber,
            emergencyContact: data.admin.emergencyContact || prev.emergencyContact,
            locationName: data.admin.locationName || prev.locationName,
            latitude: data.admin.latitude !== undefined && data.admin.latitude !== null ? data.admin.latitude : prev.latitude,
            longitude: data.admin.longitude !== undefined && data.admin.longitude !== null ? data.admin.longitude : prev.longitude,
          }));

          if (onUserUpdate) {
            onUserUpdate({
              ...user,
              ...data.admin,
              isProfileSet: profileAlreadySet,
              token: data.token || user.token,
            });
          }
        }
      } catch (err) {
        console.warn('Profile fetch warning:', err);
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [user, navigate, onUserUpdate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Upload image directly to Cloudinary from avatar
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File',
        text: 'Please select an image file (JPG, PNG, WebP).',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'File Too Large',
        text: 'Please select an image smaller than 10MB.',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result;
      setUploadingCloudinary(true);

      try {
        const headers = {
          'Content-Type': 'application/json',
          'x-admin-id': user?.id || user?._id || '',
          'x-admin-email': user?.email || '',
        };
        if (user?.token) {
          headers['Authorization'] = `Bearer ${user.token}`;
        }

        const res = await fetch('/api/admin/upload-profile-pic', {
          method: 'POST',
          headers,
          body: JSON.stringify({ image: base64Image }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Cloudinary upload failed');
        }

        setFormData((prev) => ({ ...prev, profilePic: data.url }));

        if (onUserUpdate && data.admin) {
          onUserUpdate({
            ...user,
            ...data.admin,
            token: user.token,
          });
        }

        Swal.fire({
          icon: 'success',
          title: 'Photo Updated!',
          text: 'Profile picture has been saved successfully.',
          timer: 2000,
          showConfirmButton: false,
          iconColor: '#4f46e5',
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: err.message,
          confirmButtonColor: '#4f46e5',
        });
      } finally {
        setUploadingCloudinary(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Detect GPS Location (Latitude & Longitude) via browser Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: 'warning',
        title: 'Geolocation Not Supported',
        text: 'Your browser does not support automatic location detection. You can type the location name manually.',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        // Attempt reverse geocoding via OpenStreetMap Nominatim for clean location display
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );

          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            const cleanLoc = [
              addr.hospital || addr.amenity || addr.building || addr.suburb || addr.neighbourhood,
              addr.city || addr.town || addr.village || addr.county,
              addr.state,
            ]
              .filter(Boolean)
              .join(', ');

            if (cleanLoc) {
              setFormData((prev) => ({
                ...prev,
                locationName: cleanLoc,
                city: prev.city || addr.city || addr.town || addr.county || '',
              }));
            } else if (geoData.display_name) {
              setFormData((prev) => ({
                ...prev,
                locationName: geoData.display_name.split(',').slice(0, 3).join(', '),
              }));
            }
          }
        } catch (e) {
          // If network reverse geocode fails, provide coordinate label fallback
          setFormData((prev) => ({
            ...prev,
            locationName: prev.locationName || `Lat: ${lat}, Long: ${lng}`,
          }));
        } finally {
          setDetectingLocation(false);
          Swal.fire({
            icon: 'success',
            title: 'GPS Location Detected',
            html: `Latitude: <strong>${lat}</strong><br/>Longitude: <strong>${lng}</strong>`,
            timer: 2000,
            showConfirmButton: false,
            iconColor: '#10b981',
          });
        }
      },
      (error) => {
        setDetectingLocation(false);
        let errorMsg = 'Unable to retrieve location. Please check browser permissions.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission was denied. Please allow location access in your browser.';
        }
        Swal.fire({
          icon: 'info',
          title: 'Location Permission',
          text: errorMsg,
          confirmButtonColor: '#4f46e5',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleClearCoordinates = () => {
    setFormData((prev) => ({
      ...prev,
      latitude: null,
      longitude: null,
    }));
  };

  // Save profile changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        id: user?.id || user?._id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        profilePic: formData.profilePic,
        hospitalName: formData.hospitalName,
        licenseNumber: formData.licenseNumber,
        emergencyContact: formData.emergencyContact,
        locationName: formData.locationName,
        latitude: formData.latitude !== null && formData.latitude !== '' ? Number(formData.latitude) : null,
        longitude: formData.longitude !== null && formData.longitude !== '' ? Number(formData.longitude) : null,
      };

      const headers = {
        'Content-Type': 'application/json',
        'x-admin-id': user?.id || user?._id || '',
        'x-admin-email': user?.email || '',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update admin profile');
      }

      setLoading(false);
      setIsProfileSet(true);

      const updatedUser = {
        ...user,
        ...data.admin,
        isProfileSet: true,
        token: data.token || user?.token,
      };

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      Swal.fire({
        icon: 'success',
        title: isProfileSet ? 'Profile Updated' : 'Profile Saved',
        text: 'Hospital details, essential credentials, and GPS coordinates saved successfully.',
        timer: 2000,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#0f172a',
        iconColor: '#4f46e5',
      });
    } catch (err) {
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message,
        confirmButtonColor: '#4f46e5',
      });
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4">
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden transition-all">
        {/* Sleek Top Banner */}
        <div className="h-28 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 flex justify-between items-start text-white">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all cursor-pointer text-white"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>

          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md text-indigo-200 border border-white/10">
            System Admin
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
              <div className="relative w-24 h-24 rounded-2xl ring-4 ring-white shadow-md overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-2xl font-black">
                {formData.profilePic ? (
                  <img
                    src={formData.profilePic}
                    alt={formData.name || 'Admin'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{(formData.name || formData.email || 'A')[0].toUpperCase()}</span>
                )}

                {/* Hover overlay with camera icon */}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1 text-center">
                  <Camera size={20} className="mb-0.5 text-white" />
                  <span className="text-[9px] font-bold">Change</span>
                </div>

                {/* Uploading overlay */}
                {uploadingCloudinary && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-1" />
                    <span className="text-[9px] font-bold">Saving...</span>
                  </div>
                )}
              </div>

              {/* Camera badge on avatar */}
              <div
                className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition-transform group-hover/avatar:scale-110 flex items-center justify-center ring-2 ring-white"
                title="Change photo"
              >
                <Camera size={13} />
              </div>

              <input
                id="profile-pic-upload"
                type="file"
                accept="image/*"
                disabled={uploadingCloudinary}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Profile User Info */}
            <div className="pb-1">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {formData.name || 'Admin'}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Mail size={13} className="text-indigo-600" />
                <span>{formData.email}</span>
              </p>
              {formData.hospitalName && (
                <p className="text-xs font-medium text-indigo-700 flex items-center gap-1.5 mt-1 bg-indigo-50 px-2.5 py-0.5 rounded-md w-fit border border-indigo-100">
                  <Building2 size={12} className="text-indigo-600" />
                  <span>{formData.hospitalName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Clean Form */}
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            
            {/* SECTION 1: Hospital Details & Essential Credentials */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Hospital Credentials & Essential Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hospital Name (Spans full width) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Hospital Name
                  </label>
                  <div className="relative flex items-center">
                    <Building2 className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="hospitalName"
                      value={formData.hospitalName}
                      onChange={handleChange}
                      placeholder="e.g. City LifeCare Super Speciality & Blood Center"
                      className="w-full bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 rounded-xl text-slate-900 text-sm pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                {/* Essential Credential 1: License / Registration Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    License / Registration No.
                  </label>
                  <div className="relative flex items-center">
                    <Award className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="e.g. REG-DL-2024-8976"
                      className="w-full bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 rounded-xl text-slate-900 text-sm pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                {/* Essential Credential 2: Emergency Contact / Hotline */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Emergency Helpline / Contact
                  </label>
                  <div className="relative flex items-center">
                    <PhoneCall className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      placeholder="e.g. +91 11 2345 6789"
                      className="w-full bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 rounded-xl text-slate-900 text-sm pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Hospital Location (Latitude & Longitude in DB, Location shown in UI) */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Hospital Location
                  </h2>
                </div>

                {/* Detect GPS Location Button */}
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100/80 hover:bg-indigo-200 border border-indigo-200 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  title="Detect GPS coordinates (Latitude & Longitude) using device location"
                >
                  {detectingLocation ? (
                    <>
                      <RefreshCw size={12} className="animate-spin text-indigo-600" />
                      <span>Detecting GPS...</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={12} className="text-indigo-600" />
                      <span>Detect Current Location</span>
                    </>
                  )}
                </button>
              </div>

              {/* Location Input Field in UI */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Location
                </label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="locationName"
                    value={formData.locationName}
                    onChange={handleChange}
                    placeholder="e.g. Connaught Place, New Delhi or Hospital Campus, Sector 12"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 rounded-xl text-slate-900 text-sm pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Coordinates Indicator Badge (Stored in DB as Numbers) */}
              {formData.latitude !== null && formData.longitude !== null ? (
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 transition-all">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>
                      GPS Locked: <strong>{Number(formData.latitude).toFixed(6)}° N</strong>, <strong>{Number(formData.longitude).toFixed(6)}° E</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                      Stored in DB
                    </span>
                    <button
                      type="button"
                      onClick={handleClearCoordinates}
                      className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                      title="Clear GPS coordinates"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pl-1">
                  <Crosshair size={12} className="text-slate-400" />
                  <span>Click <strong>"Detect Current Location"</strong> to link precise latitude & longitude coordinates.</span>
                </p>
              )}
            </div>

            {/* SECTION 3: Administrative Profile Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Administrator Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Administrator Name"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 rounded-xl text-slate-900 text-sm pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Email Address
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Lock size={10} /> Read-only
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    readOnly
                    value={formData.email}
                    title="Account email address cannot be changed"
                    className="w-full bg-slate-100/90 border border-slate-200 rounded-xl text-slate-500 text-sm pl-10 pr-9 py-2.5 outline-none font-medium cursor-not-allowed select-none"
                  />
                  <Lock className="absolute right-3.5 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* Personal Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Admin Phone Number
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 rounded-xl text-slate-900 text-sm pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  City
                </label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. New Delhi, Mumbai"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 rounded-xl text-slate-900 text-sm pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Administrative Address (Spans Full Width) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Hospital Street Address
                </label>
                <div className="relative flex items-center">
                  <Home className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. Main Complex, Blood Bank Wing, Plot 42"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 rounded-xl text-slate-900 text-sm pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  System Role
                </label>
                <div className="relative flex items-center">
                  <ShieldCheck className="absolute left-3.5 w-4 h-4 text-indigo-600" />
                  <input
                    type="text"
                    value="ADMIN (System Administrator)"
                    disabled
                    className="w-full bg-indigo-50/40 border border-indigo-100 rounded-xl text-indigo-900 text-sm pl-10 pr-3.5 py-2.5 cursor-not-allowed font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                <Save size={15} />
                <span>
                  {loading
                    ? (isProfileSet ? 'Updating...' : 'Saving...')
                    : (isProfileSet ? 'Update Profile' : 'Set Profile')}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
