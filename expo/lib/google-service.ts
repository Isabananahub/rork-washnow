import { Platform } from 'react-native';
import { LocationData } from './location-service';
import { trpcClient } from './trpc';

// Google API Configuration
// Try multiple API keys to find a working one
const API_KEYS = [
  'AIzaSyCSjzEynDXnUDCFSV-RrIiNxwTUzEwSaRA', // New key from user
  'AIzaSyBvOkBwgGlbUiuS-oSiuvGpZVtEHXTBTBw', // First key from user
  'AIzaSyC8UogRcMe-arNdWPaLZNdWlzWcH_n_2HM', // Second key to try
];

// Function to test API key validity
const testApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const testUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=test&key=${apiKey}`;
    const response = await fetch(testUrl);
    const data = await response.json();
    return data.status === 'OK' || data.status === 'ZERO_RESULTS';
  } catch {
    return false;
  }
};

// Find the first working API key
let GOOGLE_MAPS_API_KEY = API_KEYS[0]; // Default to first key

// Test keys on initialization (async)
(async () => {
  for (const key of API_KEYS) {
    console.log('🔑 Testing API key:', key.substring(0, 10) + '...');
    const isValid = await testApiKey(key);
    if (isValid) {
      GOOGLE_MAPS_API_KEY = key;
      console.log('✅ Found working API key:', key.substring(0, 10) + '...');
      break;
    } else {
      console.log('❌ API key failed:', key.substring(0, 10) + '...');
    }
  }
})();

// Enhanced API key validation
const validateApiKeyFormat = (key: string): boolean => {
  return !!(key && key.length > 30 && key.startsWith('AIza'));
};

API_KEYS.forEach((key, index) => {
  if (validateApiKeyFormat(key)) {
    console.log(`✅ API Key ${index + 1} format validation: PASSED`);
  } else {
    console.warn(`⚠️ API Key ${index + 1} format validation: FAILED`);
  }
});

// Alternative way to get API key from app.json extra config
const getApiKeyFromConfig = () => {
  try {
    // @ts-ignore - Expo Constants may not be typed
    const Constants = require('expo-constants').default;
    return Constants.expoConfig?.extra?.googleMapsApiKey || Constants.manifest?.extra?.googleMapsApiKey;
  } catch {
    return null;
  }
};

// Use the new Google Places API key provided by user
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || getApiKeyFromConfig() || GOOGLE_MAPS_API_KEY;

// Log API key status for debugging
console.log('🗺️ Google Maps API Key configured:', API_KEY ? 'Yes' : 'No');
console.log('🔑 Using environment key:', !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);
console.log('🔧 Using config key:', !!getApiKeyFromConfig());
console.log('🗝️ Final API key (first 10 chars):', API_KEY ? API_KEY.substring(0, 10) + '...' : 'None');
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const GOOGLE_GEOCODING_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode';
const GOOGLE_DIRECTIONS_BASE_URL = 'https://maps.googleapis.com/maps/api/directions';
const GOOGLE_DISTANCE_MATRIX_BASE_URL = 'https://maps.googleapis.com/maps/api/distancematrix';

export interface PlaceAutocomplete {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
  types: string[];
}

export interface DirectionsResult {
  routes: {
    legs: {
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      start_address: string;
      end_address: string;
      steps: {
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        html_instructions: string;
        start_location: { lat: number; lng: number };
        end_location: { lat: number; lng: number };
      }[];
    }[];
    overview_polyline: {
      points: string;
    };
  }[];
}

export interface DistanceMatrixResult {
  rows: {
    elements: {
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      status: string;
    }[];
  }[];
}

class GoogleService {
  private static instance: GoogleService;
  private apiKey: string;
  private lastRequestTime = 0;
  private readonly REQUEST_DELAY = 100; // 100ms between requests
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  constructor() {
    this.apiKey = API_KEY;
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('⚠️ Google Maps API key not configured. Using demo key for development.');
    } else {
      console.log('✅ Google Maps API service initialized successfully');
    }
  }

  static getInstance(): GoogleService {
    if (!GoogleService.instance) {
      GoogleService.instance = new GoogleService();
    }
    return GoogleService.instance;
  }

  /**
   * Get place autocomplete suggestions
   */
  async getPlaceAutocomplete(
    input: string,
    location?: LocationData,
    radius: number = 50000
  ): Promise<PlaceAutocomplete[]> {
    try {
      if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
        console.log('🚫 Google Places API key not available for autocomplete');
        return this.getFallbackSuggestions(input, 'API not configured');
      }

      // For web platform, use backend proxy
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected, using backend proxy for:', input);
        try {
          const proxyResult = await trpcClient.google.placesProxy.query({
            input,
            location,
            radius
          });
          
          if (proxyResult.success) {
            console.log('✅ Backend proxy success:', proxyResult.predictions.length, 'results');
            return proxyResult.predictions;
          } else {
            console.warn('⚠️ Backend proxy failed:', proxyResult.error);
            return this.getFallbackSuggestions(input, 'Backend proxy error');
          }
        } catch (error) {
          console.error('❌ Backend proxy error:', error);
          return this.getFallbackSuggestions(input, 'Backend proxy unavailable');
        }
      }

      let url = `${GOOGLE_PLACES_BASE_URL}/autocomplete/json?input=${encodeURIComponent(input)}&key=${this.apiKey}`;
      
      if (location) {
        url += `&location=${location.latitude},${location.longitude}&radius=${radius}`;
      }
      
      // Add session token for billing optimization
      const sessionToken = this.generateSessionToken();
      url += `&sessiontoken=${sessionToken}`;

      console.log('🔍 Fetching Google Places autocomplete for:', input);
      console.log('🔗 Request URL:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.status === 'OK') {
        console.log('✅ Google Places autocomplete success:', data.predictions?.length || 0, 'results');
        return data.predictions || [];
      } else {
        console.warn('⚠️ Google Places autocomplete error:', data.status, data.error_message);
        return this.getFallbackSuggestions(input, 'API error');
      }
    } catch (error) {
      console.error('❌ Google Places autocomplete failed:', error);
      return this.getFallbackSuggestions(input, 'Network error');
    }
  }

  /**
   * Get detailed information about a place
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      // Handle fallback place IDs
      if (placeId.startsWith('fallback_')) {
        console.log('📝 Handling fallback place ID, skipping API call');
        return null;
      }

      if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
        console.log('🚫 Google Places API key not available for place details');
        return null;
      }

      // For web platform, use backend proxy
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected, using backend proxy for place details');
        try {
          const proxyResult = await trpcClient.google.placeDetailsProxy.query({
            placeId
          });
          
          if (proxyResult.success) {
            console.log('✅ Place details proxy success:', proxyResult.result?.formatted_address);
            return proxyResult.result;
          } else {
            console.warn('⚠️ Place details proxy failed:', proxyResult.error);
            return null;
          }
        } catch (error) {
          console.error('❌ Place details proxy error:', error);
          return null;
        }
      }

      const url = `${GOOGLE_PLACES_BASE_URL}/details/json?place_id=${placeId}&fields=place_id,formatted_address,geometry,name,types&key=${this.apiKey}`;
      
      console.log('📍 Fetching Google Place details for:', placeId);
      console.log('🔗 Request URL:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.status === 'OK') {
        console.log('✅ Google Place details success:', data.result?.formatted_address);
        return data.result;
      } else {
        console.warn('⚠️ Google Place details error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('❌ Google Place details failed:', error);
      return null;
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<LocationData | null> {
    try {
      if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
        console.log('🚫 Google Geocoding API key not available');
        return null;
      }

      // For web platform, skip geocoding API call
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected, skipping geocoding API call');
        return null;
      }

      const url = `${GOOGLE_GEOCODING_BASE_URL}/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        console.log('✅ Geocoding success for:', address);
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          address: result.formatted_address,
        };
      } else {
        console.warn('⚠️ Geocoding failed:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address with rate limiting
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    return this.queueRequest(async () => {
      try {
        if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
          return null;
        }

        const url = `${GOOGLE_GEOCODING_BASE_URL}/json?latlng=${latitude},${longitude}&key=${this.apiKey}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
          return data.results[0].formatted_address;
        } else if (data.status === 'OVER_QUERY_LIMIT') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return null;
        } else {
          return null;
        }
      } catch {
        return null;
      }
    });
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: LocationData | string,
    destination: LocationData | string,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<DirectionsResult | null> {
    try {
      if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('Google Directions API key not configured');
        return null;
      }

      const originStr = typeof origin === 'string' 
        ? encodeURIComponent(origin)
        : `${origin.latitude},${origin.longitude}`;
      
      const destinationStr = typeof destination === 'string'
        ? encodeURIComponent(destination)
        : `${destination.latitude},${destination.longitude}`;

      const url = `${GOOGLE_DIRECTIONS_BASE_URL}/json?origin=${originStr}&destination=${destinationStr}&mode=${mode}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data;
      } else {
        console.error('Google Directions error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  }

  /**
   * Calculate distance and duration between multiple origins and destinations
   */
  async getDistanceMatrix(
    origins: (LocationData | string)[],
    destinations: (LocationData | string)[],
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<DistanceMatrixResult | null> {
    try {
      if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('Google Distance Matrix API key not configured');
        return null;
      }

      const originsStr = origins.map(origin => 
        typeof origin === 'string' 
          ? encodeURIComponent(origin)
          : `${origin.latitude},${origin.longitude}`
      ).join('|');
      
      const destinationsStr = destinations.map(destination => 
        typeof destination === 'string'
          ? encodeURIComponent(destination)
          : `${destination.latitude},${destination.longitude}`
      ).join('|');

      const url = `${GOOGLE_DISTANCE_MATRIX_BASE_URL}/json?origins=${originsStr}&destinations=${destinationsStr}&mode=${mode}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data;
      } else {
        console.error('Google Distance Matrix error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Error getting distance matrix:', error);
      return null;
    }
  }

  /**
   * Find nearby laundry masters for a customer location
   */
  async findNearbyLaundryMasters(
    customerLocation: LocationData,
    laundryMasters: Array<{ id: string; location?: LocationData; name: string }>,
    maxDistanceKm: number = 10
  ): Promise<Array<{ id: string; name: string; location: LocationData; distance: string; duration: string; distanceValue: number }>> {
    try {
      const validMasters = laundryMasters.filter(master => master.location);
      
      if (validMasters.length === 0) {
        return [];
      }

      const destinations = validMasters.map(master => master.location!);
      const distanceMatrix = await this.getDistanceMatrix([customerLocation], destinations, 'driving');
      
      if (!distanceMatrix || !distanceMatrix.rows[0]) {
        return [];
      }

      const results = validMasters
        .map((master, index) => {
          const element = distanceMatrix.rows[0].elements[index];
          if (element.status === 'OK') {
            const distanceKm = element.distance.value / 1000;
            if (distanceKm <= maxDistanceKm) {
              return {
                id: master.id,
                name: master.name,
                location: master.location!,
                distance: element.distance.text,
                duration: element.duration.text,
                distanceValue: distanceKm,
              };
            }
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => a!.distanceValue - b!.distanceValue);

      return results as Array<{ id: string; name: string; location: LocationData; distance: string; duration: string; distanceValue: number }>;
    } catch (error) {
      console.error('Error finding nearby laundry masters:', error);
      return [];
    }
  }

  /**
   * Generate fallback suggestions when Google Places API is not available
   */
  private getFallbackSuggestions(input: string, reason: string): PlaceAutocomplete[] {
    const suggestions: PlaceAutocomplete[] = [
      {
        place_id: `fallback_${Date.now()}_1`,
        description: `${input}`,
        structured_formatting: {
          main_text: input,
          secondary_text: `Manual entry (${reason})`
        },
        types: ['establishment']
      }
    ];

    // Add some common address patterns if the input looks like an address
    if (input.length > 3) {
      const commonSuffixes = ['Street', 'Avenue', 'Road', 'Drive', 'Lane', 'Boulevard'];
      const inputLower = input.toLowerCase();
      
      commonSuffixes.forEach((suffix, index) => {
        if (!inputLower.includes(suffix.toLowerCase()) && input.match(/\d/)) {
          suggestions.push({
            place_id: `fallback_${Date.now()}_${index + 2}`,
            description: `${input} ${suffix}`,
            structured_formatting: {
              main_text: `${input} ${suffix}`,
              secondary_text: `Suggested address format`
            },
            types: ['route']
          });
        }
      });
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Generate a session token for Places API billing optimization
   */
  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get static map URL for displaying maps in web or as fallback
   */
  getStaticMapUrl(
    center: LocationData,
    zoom: number = 15,
    size: string = '400x300',
    markers?: Array<{ location: LocationData; label?: string; color?: string }>
  ): string {
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      return '';
    }

    let url = `https://maps.googleapis.com/maps/api/staticmap?center=${center.latitude},${center.longitude}&zoom=${zoom}&size=${size}&key=${this.apiKey}`;
    
    if (markers && markers.length > 0) {
      markers.forEach((marker, index) => {
        const color = marker.color || 'red';
        const label = marker.label || String.fromCharCode(65 + index); // A, B, C...
        url += `&markers=color:${color}|label:${label}|${marker.location.latitude},${marker.location.longitude}`;
      });
    } else {
      // Add a marker at the center
      url += `&markers=color:red|${center.latitude},${center.longitude}`;
    }
    
    return url;
  }

  /**
   * Check if Google API is properly configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey !== 'YOUR_API_KEY_HERE');
  }

  /**
   * Get the API key (for debugging purposes)
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Queue requests to implement rate limiting
   */
  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Process the request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.REQUEST_DELAY) {
        const delay = this.REQUEST_DELAY - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const request = this.requestQueue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }

    this.isProcessingQueue = false;
  }
}

export const googleService = GoogleService.getInstance();
export default googleService;