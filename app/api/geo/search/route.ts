import { NextRequest, NextResponse } from 'next/server';

interface GeoPlaceResult {
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

// Built-in offline quick directory of prominent Indian & World cities
const TOP_CURATED_CITIES: GeoPlaceResult[] = [
  { name: 'New Delhi, Delhi, India', city: 'New Delhi', state: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.209, timezone: 5.5 },
  { name: 'Mumbai, Maharashtra, India', city: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.076, longitude: 72.8777, timezone: 5.5 },
  { name: 'Bengaluru, Karnataka, India', city: 'Bengaluru', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946, timezone: 5.5 },
  { name: 'Kolkata, West Bengal, India', city: 'Kolkata', state: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639, timezone: 5.5 },
  { name: 'Chennai, Tamil Nadu, India', city: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707, timezone: 5.5 },
  { name: 'Hyderabad, Telangana, India', city: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.385, longitude: 78.4867, timezone: 5.5 },
  { name: 'Ahmedabad, Gujarat, India', city: 'Ahmedabad', state: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714, timezone: 5.5 },
  { name: 'Pune, Maharashtra, India', city: 'Pune', state: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567, timezone: 5.5 },
  { name: 'Jaipur, Rajasthan, India', city: 'Jaipur', state: 'Rajasthan', country: 'India', latitude: 26.9124, longitude: 75.7873, timezone: 5.5 },
  { name: 'Lucknow, Uttar Pradesh, India', city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', latitude: 26.8467, longitude: 80.9462, timezone: 5.5 },
  { name: 'Varanasi, Uttar Pradesh, India', city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', latitude: 25.3176, longitude: 82.9739, timezone: 5.5 },
  { name: 'Patna, Bihar, India', city: 'Patna', state: 'Bihar', country: 'India', latitude: 25.5941, longitude: 85.1376, timezone: 5.5 },
  { name: 'Bhopal, Madhya Pradesh, India', city: 'Bhopal', state: 'Madhya Pradesh', country: 'India', latitude: 23.2599, longitude: 77.4126, timezone: 5.5 },
  { name: 'Indore, Madhya Pradesh, India', city: 'Indore', state: 'Madhya Pradesh', country: 'India', latitude: 22.7196, longitude: 75.8577, timezone: 5.5 },
  { name: 'Chandigarh, Punjab, India', city: 'Chandigarh', state: 'Punjab', country: 'India', latitude: 30.7333, longitude: 76.7794, timezone: 5.5 },
  { name: 'Surat, Gujarat, India', city: 'Surat', state: 'Gujarat', country: 'India', latitude: 21.1702, longitude: 72.8311, timezone: 5.5 },
  { name: 'Nagpur, Maharashtra, India', city: 'Nagpur', state: 'Maharashtra', country: 'India', latitude: 21.1458, longitude: 79.0882, timezone: 5.5 },
  { name: 'Kanpur, Uttar Pradesh, India', city: 'Kanpur', state: 'Uttar Pradesh', country: 'India', latitude: 26.4499, longitude: 80.3319, timezone: 5.5 },
  { name: 'Prayagraj (Allahabad), Uttar Pradesh, India', city: 'Prayagraj', state: 'Uttar Pradesh', country: 'India', latitude: 25.4358, longitude: 81.8463, timezone: 5.5 },
  { name: 'Ranchi, Jharkhand, India', city: 'Ranchi', state: 'Jharkhand', country: 'India', latitude: 23.3441, longitude: 85.3096, timezone: 5.5 },
  { name: 'Guwahati, Assam, India', city: 'Guwahati', state: 'Assam', country: 'India', latitude: 26.1445, longitude: 91.7362, timezone: 5.5 },
  { name: 'Bhubaneswar, Odisha, India', city: 'Bhubaneswar', state: 'Odisha', country: 'India', latitude: 20.2961, longitude: 85.8245, timezone: 5.5 },
  { name: 'Dehradun, Uttarakhand, India', city: 'Dehradun', state: 'Uttarakhand', country: 'India', latitude: 30.3165, longitude: 78.0322, timezone: 5.5 },
  { name: 'Shimla, Himachal Pradesh, India', city: 'Shimla', state: 'Himachal Pradesh', country: 'India', latitude: 31.1048, longitude: 77.1734, timezone: 5.5 },
  { name: 'Srinagar, Jammu and Kashmir, India', city: 'Srinagar', state: 'Jammu and Kashmir', country: 'India', latitude: 34.0837, longitude: 74.7973, timezone: 5.5 },
  { name: 'London, United Kingdom', city: 'London', state: 'England', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 0.0 },
  { name: 'New York, NY, United States', city: 'New York', state: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, timezone: -5.0 },
  { name: 'San Francisco, CA, United States', city: 'San Francisco', state: 'California', country: 'United States', latitude: 37.7749, longitude: -122.4194, timezone: -8.0 },
  { name: 'Dubai, United Arab Emirates', city: 'Dubai', state: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, timezone: 4.0 },
  { name: 'Singapore, Singapore', city: 'Singapore', state: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 8.0 },
  { name: 'Toronto, Ontario, Canada', city: 'Toronto', state: 'Ontario', country: 'Canada', latitude: 43.6532, longitude: -79.3832, timezone: -5.0 },
  { name: 'Sydney, New South Wales, Australia', city: 'Sydney', state: 'New South Wales', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 10.0 },
  { name: 'Kathmandu, Nepal', city: 'Kathmandu', state: 'Bagmati', country: 'Nepal', latitude: 27.7172, longitude: 85.324, timezone: 5.75 },
];

function getTimezoneForCoordinates(lat: number, lon: number, country: string): number {
  // India is always +5.5 UTC
  if (
    country.toLowerCase().includes('india') ||
    (lat >= 6.0 && lat <= 37.5 && lon >= 68.0 && lon <= 97.5)
  ) {
    return 5.5;
  }

  // Nepal is +5.75
  if (country.toLowerCase().includes('nepal')) return 5.75;
  // Sri Lanka is +5.5
  if (country.toLowerCase().includes('sri lanka')) return 5.5;
  // Bangladesh is +6.0
  if (country.toLowerCase().includes('bangladesh')) return 6.0;
  // UAE is +4.0
  if (country.toLowerCase().includes('united arab emirates') || country.toLowerCase().includes('dubai')) return 4.0;
  // UK is 0.0 (or +1 BST)
  if (country.toLowerCase().includes('united kingdom') || country.toLowerCase().includes('uk')) return 0.0;
  // Australia Sydney +10.0
  if (country.toLowerCase().includes('australia')) {
    if (lon > 140) return 10.0;
    if (lon > 125) return 9.5;
    return 8.0;
  }

  // Default solar time approximation rounded to nearest half hour
  const approxOffset = Math.round((lon / 15.0) * 2) / 2;
  return approxOffset;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim() || '';
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');

  // Reverse Geocoding (if lat & lon provided)
  if (latParam && lonParam) {
    try {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        {
          headers: { 'User-Agent': 'AstroGemini/1.0' },
          next: { revalidate: 86400 },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.county || 'Detected Place';
        const state = addr.state || '';
        const country = addr.country || 'India';
        const displayName = [city, state, country].filter(Boolean).join(', ');
        const tz = getTimezoneForCoordinates(lat, lon, country);

        return NextResponse.json([
          {
            name: displayName,
            city,
            state,
            country,
            latitude: lat,
            longitude: lon,
            timezone: tz,
          },
        ]);
      }
    } catch (e) {
      console.error('Reverse Geocode Error:', e);
    }
  }

  if (!query || query.length < 2) {
    return NextResponse.json(TOP_CURATED_CITIES.slice(0, 8));
  }

  // 1. Check curated list first for instantaneous matching
  const localMatches = TOP_CURATED_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.city.toLowerCase().includes(query.toLowerCase())
  );

  // 2. Fetch live results from Photon (Komoot OSM Geocoder API - free & fast)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8`;
    const response = await fetch(photonUrl, {
      headers: { 'User-Agent': 'AstroGemini/1.0' },
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = await response.json();
      const features = data.features || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: GeoPlaceResult[] = features.map((f: any) => {
        const props = f.properties || {};
        const coords = f.geometry?.coordinates || [0, 0];
        const lon = coords[0];
        const lat = coords[1];

        const city = props.name || props.city || props.town || props.district || query;
        const state = props.state || '';
        const country = props.country || 'India';
        const formattedName = [city, state, country].filter(Boolean).join(', ');
        const tz = getTimezoneForCoordinates(lat, lon, country);

        return {
          name: formattedName,
          city,
          state,
          country,
          latitude: parseFloat(lat.toFixed(4)),
          longitude: parseFloat(lon.toFixed(4)),
          timezone: tz,
        };
      });

      // Combine with local matches and remove duplicate city names
      const seen = new Set<string>();
      const combined = [...localMatches, ...results].filter((item) => {
        const key = `${item.city.toLowerCase()}-${item.country.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return NextResponse.json(combined.slice(0, 10));
    }
  } catch (err) {
    console.warn('Photon Geocoding API failed, falling back to local matches:', err);
  }

  return NextResponse.json(localMatches.length > 0 ? localMatches : TOP_CURATED_CITIES.slice(0, 8));
}
