import { publicProcedure } from '../../../create-context';
import { z } from 'zod';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBvOkBwgGlbUiuS-oSiuvGpZVtEHXTBTBw';

// San Diego, CA 92123 coordinates
const SAN_DIEGO_92123_COORDS = {
  latitude: 32.7767,
  longitude: -117.1611
};

export const testGoogleApiProcedure = publicProcedure
  .input(z.object({
    testType: z.enum(['places', 'geocoding', 'directions', 'laundry-search']).optional().default('places')
  }))
  .query(async ({ input }: { input: { testType?: 'places' | 'geocoding' | 'directions' | 'laundry-search' } }) => {
    const { testType } = input;
    
    try {
      console.log('🧪 Testing Google API:', testType);
      
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.length < 30) {
        return {
          success: false,
          error: 'API key not configured',
          details: 'Google Maps API key is missing or not set'
        };
      }

      let testUrl = '';
      let testName = '';
      
      switch (testType) {
        case 'places':
          testUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=New+York&key=${GOOGLE_MAPS_API_KEY}`;
          testName = 'Places Autocomplete';
          break;
        case 'geocoding':
          testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=New+York&key=${GOOGLE_MAPS_API_KEY}`;
          testName = 'Geocoding';
          break;
        case 'directions':
          testUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=New+York&destination=Boston&key=${GOOGLE_MAPS_API_KEY}`;
          testName = 'Directions';
          break;
        case 'laundry-search':
          testUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${SAN_DIEGO_92123_COORDS.latitude},${SAN_DIEGO_92123_COORDS.longitude}&radius=5000&type=laundry&key=${GOOGLE_MAPS_API_KEY}`;
          testName = 'Laundry Business Search (San Diego 92123)';
          break;
      }
      
      console.log('🔗 Testing URL:', testUrl.replace(GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN'));
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      console.log('📊 API Response Status:', data.status);
      console.log('📊 HTTP Status:', response.status);
      
      if (response.ok && data.status === 'OK') {
        let resultsCount = 0;
        let businessDetails = [];
        
        if (testType === 'laundry-search' && data.results) {
          resultsCount = data.results.length;
          businessDetails = data.results.map((place: any) => ({
            name: place.name,
            address: place.vicinity,
            rating: place.rating,
            types: place.types,
            place_id: place.place_id,
            open_now: place.opening_hours?.open_now
          }));
          console.log('🏪 Found laundry businesses:', businessDetails);
        } else {
          resultsCount = data.predictions?.length || data.results?.length || data.routes?.length || 0;
        }
        
        return {
          success: true,
          message: `${testName} API is working correctly`,
          status: data.status,
          httpStatus: response.status,
          resultsCount,
          businessDetails: testType === 'laundry-search' ? businessDetails : undefined
        };
      } else {
        return {
          success: false,
          error: `${testName} API failed`,
          status: data.status,
          httpStatus: response.status,
          errorMessage: data.error_message,
          details: data
        };
      }
    } catch (error) {
      console.error('❌ Google API test failed:', error);
      return {
        success: false,
        error: 'Network or server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

// Comprehensive laundry business finder for San Diego
export const findLaundryBusinessesProcedure = publicProcedure
  .input(z.object({
    location: z.object({
      latitude: z.number(),
      longitude: z.number()
    }).optional().default(SAN_DIEGO_92123_COORDS),
    radius: z.number().optional().default(5000),
    keyword: z.string().optional().default('laundry')
  }))
  .query(async ({ input }: { input: { location?: { latitude: number; longitude: number }; radius?: number; keyword?: string } }) => {
    const { location = SAN_DIEGO_92123_COORDS, radius = 5000 } = input;
    
    try {
      console.log('🔍 Searching for laundry businesses near:', location);
      
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.length < 30) {
        return {
          success: false,
          error: 'API key not configured',
          businesses: []
        };
      }

      // Multiple search strategies for comprehensive results
      const searchQueries = [
        // Nearby search with type
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location!.latitude},${location!.longitude}&radius=${radius}&type=laundry&key=${GOOGLE_MAPS_API_KEY}`,
        // Text search for laundromats
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=laundromat+near+${location!.latitude},${location!.longitude}&radius=${radius}&key=${GOOGLE_MAPS_API_KEY}`,
        // Text search for dry cleaners
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=dry+cleaning+near+${location!.latitude},${location!.longitude}&radius=${radius}&key=${GOOGLE_MAPS_API_KEY}`,
        // Text search for wash and fold
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=wash+and+fold+near+${location!.latitude},${location!.longitude}&radius=${radius}&key=${GOOGLE_MAPS_API_KEY}`
      ];

      const allBusinesses = new Map();
      let totalRequests = 0;
      let successfulRequests = 0;

      for (const [index, searchUrl] of searchQueries.entries()) {
        try {
          totalRequests++;
          console.log(`🔗 Search ${index + 1}:`, searchUrl.replace(GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN'));
          
          const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.status === 'OK' && data.results) {
              successfulRequests++;
              console.log(`✅ Search ${index + 1} found:`, data.results.length, 'businesses');
              
              data.results.forEach((place: any) => {
                if (!allBusinesses.has(place.place_id)) {
                  allBusinesses.set(place.place_id, {
                    place_id: place.place_id,
                    name: place.name,
                    address: place.formatted_address || place.vicinity,
                    rating: place.rating,
                    user_ratings_total: place.user_ratings_total,
                    types: place.types,
                    geometry: place.geometry,
                    opening_hours: place.opening_hours,
                    price_level: place.price_level,
                    photos: place.photos?.slice(0, 1), // Just first photo
                    business_status: place.business_status
                  });
                }
              });
            } else {
              console.warn(`⚠️ Search ${index + 1} returned:`, data.status, data.error_message);
            }
          } else {
            console.error(`❌ Search ${index + 1} HTTP error:`, response.status);
          }
          
          // Rate limiting - wait between requests
          if (index < searchQueries.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          console.error(`❌ Search ${index + 1} failed:`, error);
        }
      }

      const businesses = Array.from(allBusinesses.values());
      
      // Sort by rating and user count
      businesses.sort((a, b) => {
        const aScore = (a.rating || 0) * Math.log(a.user_ratings_total || 1);
        const bScore = (b.rating || 0) * Math.log(b.user_ratings_total || 1);
        return bScore - aScore;
      });

      console.log('🏪 Total unique businesses found:', businesses.length);
      console.log('📊 Search success rate:', `${successfulRequests}/${totalRequests}`);
      
      return {
        success: true,
        businesses,
        totalFound: businesses.length,
        searchStats: {
          totalRequests,
          successfulRequests,
          location,
          radius
        }
      };
    } catch (error) {
      console.error('❌ Laundry business search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        businesses: []
      };
    }
  });

export default { testGoogleApi: testGoogleApiProcedure, findLaundryBusinesses: findLaundryBusinessesProcedure };