import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { googleService } from './google-service';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

class LocationService {
  private static instance: LocationService;
  private geocodeCache = new Map<string, { address: string; timestamp: number }>();
  private lastGeocodeTime = 0;
  private readonly GEOCODE_DELAY = 1000; // 1 second between requests
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      if (Platform.OS === 'web') {
        // For web, use browser geolocation API
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            resolve({ granted: false, canAskAgain: false });
            return;
          }

          navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
            resolve({
              granted: result.state === 'granted',
              canAskAgain: result.state !== 'denied',
            });
          }).catch(() => {
            // Fallback: try to get location directly
            navigator.geolocation.getCurrentPosition(
              () => resolve({ granted: true, canAskAgain: true }),
              () => resolve({ granted: false, canAskAgain: true })
            );
          });
        });
      }

      // For mobile platforms
      const { status } = await Location.requestForegroundPermissionsAsync();
      return {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
      };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return { granted: false, canAskAgain: false };
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const permission = await this.requestLocationPermission();
      if (!permission.granted) {
        throw new Error('Location permission not granted');
      }

      if (Platform.OS === 'web') {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              console.error('Web geolocation error:', error);
              reject(new Error('Failed to get location'));
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 10000,
            }
          );
        });
      }

      // For mobile platforms
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      // Create cache key
      const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
      
      // Check cache first
      const cached = this.geocodeCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('Using cached geocode result');
        return cached.address;
      }

      // Rate limiting - ensure we don't make requests too frequently
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastGeocodeTime;
      if (timeSinceLastRequest < this.GEOCODE_DELAY) {
        const delay = this.GEOCODE_DELAY - timeSinceLastRequest;
        console.log(`Rate limiting: waiting ${delay}ms before geocoding`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      this.lastGeocodeTime = Date.now();

      let address: string | null = null;

      // Try Google Geocoding API first if configured
      if (googleService.isConfigured()) {
        console.log('Using Google Geocoding API');
        address = await googleService.reverseGeocode(latitude, longitude);
      }

      // Fallback to Expo Location API for mobile platforms
      if (!address && Platform.OS !== 'web') {
        console.log('Falling back to Expo Location API');
        try {
          const addresses = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          if (addresses.length > 0) {
            const locationAddress = addresses[0];
            const parts = [
              locationAddress.streetNumber,
              locationAddress.street,
              locationAddress.city,
              locationAddress.region,
              locationAddress.postalCode,
            ].filter(Boolean);
            
            address = parts.join(', ');
          }
        } catch (expoError) {
          console.error('Expo Location reverseGeocode failed:', expoError);
        }
      }

      // Final fallback - return coordinates
      if (!address) {
        address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }

      // Cache the result
      if (address) {
        this.geocodeCache.set(cacheKey, {
          address,
          timestamp: Date.now(),
        });
      }

      return address;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Return coordinates as fallback
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  }

  async getLocationWithAddress(): Promise<LocationData | null> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) return null;

      const address = await this.reverseGeocode(location.latitude, location.longitude);
      
      return {
        ...location,
        address: address || undefined,
      };
    } catch (error) {
      console.error('Error getting location with address:', error);
      return null;
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  findNearbyUsers(
    userLocation: LocationData,
    allUsers: Array<{ id: string; location?: LocationData }>,
    maxDistanceKm: number = 10
  ): Array<{ id: string; location: LocationData; distance: number }> {
    return allUsers
      .filter((user) => user.location)
      .map((user) => ({
        id: user.id,
        location: user.location!,
        distance: this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          user.location!.latitude,
          user.location!.longitude
        ),
      }))
      .filter((user) => user.distance <= maxDistanceKm)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Clear the geocoding cache
   */
  clearGeocodeCache(): void {
    this.geocodeCache.clear();
    console.log('Geocoding cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: Array<{ key: string; age: number }> } {
    const now = Date.now();
    const entries = Array.from(this.geocodeCache.entries()).map(([key, value]) => ({
      key,
      age: now - value.timestamp,
    }));
    
    return {
      size: this.geocodeCache.size,
      entries,
    };
  }
}

export const locationService = LocationService.getInstance();