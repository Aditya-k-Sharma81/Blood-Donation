import { useEffect, useRef, useState, useCallback } from 'react';

// Distance approximation in meters between two lat/lng coordinates
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Custom Hook: useDonorAutoLocation
 * Automatically queries GPS location every 5 minutes and saves it to the backend for DONOR users.
 */
export default function useDonorAutoLocation(user, onUserUpdate) {
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error' | 'denied'
  const [lastSyncedTime, setLastSyncedTime] = useState(() => {
    return user?.lastLocationUpdate ? new Date(user.lastLocationUpdate) : null;
  });

  const isSyncingRef = useRef(false);
  const lastCoordsRef = useRef({
    latitude: user?.latitude ?? null,
    longitude: user?.longitude ?? null,
  });

  // Keep ref up to date with props
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
    if (user?.latitude && user?.longitude) {
      lastCoordsRef.current = {
        latitude: user.latitude,
        longitude: user.longitude,
      };
    }
  }, [user]);

  const onUserUpdateRef = useRef(onUserUpdate);
  useEffect(() => {
    onUserUpdateRef.current = onUserUpdate;
  }, [onUserUpdate]);

  const performLocationSync = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || currentUser.role !== 'DONOR') {
      return;
    }

    if (!navigator.geolocation) {
      setSyncStatus('unsupported');
      return;
    }

    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncStatus('syncing');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));

          let locationName = currentUser.lastLocation || currentUser.currentLocation || '';
          let cityName = currentUser.city || '';

          // Check if user has moved more than 60 meters from previous coordinates
          const prev = lastCoordsRef.current;
          const distanceMoved = getDistanceInMeters(prev.latitude, prev.longitude, lat, lng);

          // If location is missing or user has moved significantly (> 60m), reverse geocode
          if (!locationName || distanceMoved > 60) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 6000);

              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
                {
                  headers: { 'Accept-Language': 'en' },
                  signal: controller.signal,
                }
              );
              clearTimeout(timeoutId);

              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData && geoData.display_name) {
                  locationName = geoData.display_name;
                  const parsedCity =
                    geoData.address?.city ||
                    geoData.address?.town ||
                    geoData.address?.village ||
                    geoData.address?.state_district ||
                    geoData.address?.state ||
                    '';
                  if (parsedCity) cityName = parsedCity;
                }
              }
            } catch (geoErr) {
              // Non-blocking: If Nominatim fails or times out, we still proceed with lat/lng
              console.warn('[AutoLocationSync] Reverse geocode lookup skipped or timed out:', geoErr.message);
            }
          }

          // Send to backend
          const headers = {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id || currentUser._id || '',
            'x-donor-id': currentUser.id || currentUser._id || '',
            'x-user-email': currentUser.email || '',
          };
          if (currentUser.token) {
            headers['Authorization'] = `Bearer ${currentUser.token}`;
          }

          const res = await fetch('/api/donor/location', {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              latitude: lat,
              longitude: lng,
              lastLocation: locationName,
              city: cityName,
            }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            const now = new Date();
            setLastSyncedTime(now);
            setSyncStatus('synced');
            lastCoordsRef.current = { latitude: lat, longitude: lng };

            // Update localStorage & parent state silently
            try {
              const currentSaved = JSON.parse(localStorage.getItem('rakt_user') || '{}');
              const updatedUser = {
                ...currentSaved,
                latitude: lat,
                longitude: lng,
                lastLocation: locationName || currentSaved.lastLocation,
                city: cityName || currentSaved.city,
                lastLocationUpdate: now.toISOString(),
              };
              delete updatedUser.currentLocation;
              localStorage.setItem('rakt_user', JSON.stringify(updatedUser));

              if (onUserUpdateRef.current) {
                onUserUpdateRef.current(updatedUser);
              }
            } catch (storageErr) {
              console.warn('[AutoLocationSync] LocalStorage sync warning:', storageErr);
            }
          } else {
            setSyncStatus('error');
          }
        } catch (err) {
          console.warn('[AutoLocationSync] Error during location sync:', err);
          setSyncStatus('error');
        } finally {
          isSyncingRef.current = false;
        }
      },
      (geoError) => {
        isSyncingRef.current = false;
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setSyncStatus('denied');
        } else {
          setSyncStatus('error');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'DONOR') {
      return;
    }

    // 1. Initial sync after a short delay (3s) to allow page hydration
    const initialTimer = setTimeout(() => {
      performLocationSync();
    }, 3000);

    // 2. Periodic sync every 5 minutes (300,000 ms)
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const intervalTimer = setInterval(() => {
      performLocationSync();
    }, FIVE_MINUTES_MS);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [user?.id, user?._id, user?.role, performLocationSync]);

  return {
    syncStatus,
    lastSyncedTime,
    triggerManualSync: performLocationSync,
  };
}
