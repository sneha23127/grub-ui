// ──────────────────────────────────────────────
//  GrubSpot Location Utilities
// ──────────────────────────────────────────────

/**
 * Calculate the straight-line distance (km) between two lat/lng points
 * using the Haversine formula.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km
}

/**
 * Format a distance value for display.
 */
export function formatDistance(km) {
  if (km == null || isNaN(km)) return 'Not calculated';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

/**
 * Parse a formatted distance string back to a numeric km value for sorting.
 * Returns Infinity for 'Not calculated' or unrecognised strings so they sort to the end.
 */
export function parseDistance(distStr) {
  if (!distStr || distStr === 'Not calculated' || distStr === 'N/A' || distStr === 'Calculating...') return Infinity;
  const mMatch = distStr.match(/^(\d+)\s*m away/);
  if (mMatch) return parseInt(mMatch[1], 10) / 1000;
  const kmMatch = distStr.match(/^([\d.]+)\s*km away/);
  if (kmMatch) return parseFloat(kmMatch[1]);
  return Infinity;
}

/**
 * Geocode an address string to { lat, lng } using OpenStreetMap Nominatim.
 * - Automatically appends "Bengaluru, Karnataka, India" context if missing.
 * - Limits results to India with a Bengaluru viewbox preference.
 * - Caches results in sessionStorage to avoid redundant API calls.
 * Returns null if geocoding fails.
 */
export async function geocodeAddress(address) {
  if (!address || address === 'N/A' || address === 'Location not set') return null;

  // Inject Bengaluru context so Nominatim can resolve Indian locality names
  const hasBengaluru = /bengaluru|bangalore/i.test(address);
  const fullAddress = hasBengaluru
    ? address.trim()
    : `${address.trim()}, Bengaluru, Karnataka, India`;

  const cacheKey = `geocache_v2_${fullAddress.toLowerCase()}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { /* ignore bad cache */ }
  }

  // Bengaluru bounding box: left, top, right, bottom (lon_min, lat_max, lon_max, lat_min)
  const viewbox = '77.3,13.2,77.9,12.6';

  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(fullAddress)}` +
      `&format=json&limit=1&countrycodes=in` +
      `&viewbox=${viewbox}&bounded=0`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'GrubSpot/1.0 (mess-finder-bengaluru)',
      },
    });

    if (!res.ok) {
      console.warn('Nominatim HTTP error:', res.status);
      return null;
    }

    const data = await res.json();
    if (data && data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      sessionStorage.setItem(cacheKey, JSON.stringify(coords));
      return coords;
    }

    console.warn('Nominatim: no results for address:', fullAddress);
    return null;
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}

/**
 * Get user's stored location from sessionStorage.
 * Returns { lat, lng } or null.
 */
export function getUserCoords() {
  const stored = sessionStorage.getItem('userCoords');
  try { return stored ? JSON.parse(stored) : null; } catch (e) { return null; }
}

// Singleton promise so only one browser location prompt fires at a time
let _locationPromise = null;

/**
 * Request the browser's geolocation and store it in sessionStorage.
 * Uses a singleton so multiple simultaneous callers share one prompt.
 * Returns a Promise that resolves to { lat, lng } or null if denied/unavailable.
 */
export function requestUserLocation() {
  // Return cached coords immediately if already available
  const existing = getUserCoords();
  if (existing) return Promise.resolve(existing);

  // Reuse an in-flight request if one already exists
  if (_locationPromise) return _locationPromise;

  _locationPromise = new Promise((resolve) => {
    if (!navigator.geolocation) {
      _locationPromise = null;
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        sessionStorage.setItem('userCoords', JSON.stringify(coords));
        _locationPromise = null;
        resolve(coords);
      },
      (err) => {
        console.warn('Location permission denied or unavailable:', err.message);
        _locationPromise = null;
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });

  return _locationPromise;
}

/**
 * Given user coords and a mess address string, return a formatted distance string.
 * Geocodes the address via Nominatim (with caching) and computes Haversine distance.
 * Prefer getDistanceFromCoords() when lat/lng are already available.
 */
export async function getDistanceToMess(userCoords, messAddress) {
  if (!userCoords || !messAddress) return 'Not calculated';
  const messCoords = await geocodeAddress(messAddress);
  if (!messCoords) return 'Not calculated';
  const km = haversineDistance(userCoords.lat, userCoords.lng, messCoords.lat, messCoords.lng);
  return formatDistance(km);
}

/**
 * Compute distance directly from stored lat/lng — no geocoding, instant result.
 * @param {Object} userCoords  - { lat, lng } of the user
 * @param {number|string} messLat  - mess latitude from DB
 * @param {number|string} messLng  - mess longitude from DB
 */
export function getDistanceFromCoords(userCoords, messLat, messLng) {
  if (!userCoords) return 'Not calculated';
  const lat = parseFloat(messLat);
  const lng = parseFloat(messLng);
  if (isNaN(lat) || isNaN(lng)) return null; // null means "fall back to address geocoding"
  const km = haversineDistance(userCoords.lat, userCoords.lng, lat, lng);
  return formatDistance(km);
}

