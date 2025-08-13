import { publicProcedure } from '../../../create-context';
import { z } from 'zod';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBvOkBwgGlbUiuS-oSiuvGpZVtEHXTBTBw';

export const testGoogleApiProcedure = publicProcedure
  .input(z.object({
    testType: z.enum(['places', 'geocoding', 'directions']).optional().default('places')
  }))
  .query(async ({ input }: { input: { testType: 'places' | 'geocoding' | 'directions' } }) => {
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
        return {
          success: true,
          message: `${testName} API is working correctly`,
          status: data.status,
          httpStatus: response.status,
          resultsCount: data.predictions?.length || data.results?.length || data.routes?.length || 0
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

export default testGoogleApiProcedure;