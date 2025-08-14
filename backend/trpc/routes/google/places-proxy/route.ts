import { publicProcedure } from '../../../create-context';
import { z } from 'zod';

// Updated API key from value section as requested
const GOOGLE_MAPS_API_KEY = 'AIzaSyBvOkBwgGlbUiuS-oSiuvGpZVtEHXTBTBw';

export const placesProxyProcedure = publicProcedure
  .input(z.object({
    input: z.string(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number()
    }).optional(),
    radius: z.number().optional().default(50000)
  }))
  .query(async ({ input: queryParams }) => {
    try {
      console.log('🔍 Places proxy request for:', queryParams.input);
      
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.length < 30) {
        throw new Error('Google Maps API key not configured');
      }

      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(queryParams.input)}&key=${GOOGLE_MAPS_API_KEY}`;
      
      if (queryParams.location) {
        url += `&location=${queryParams.location.latitude},${queryParams.location.longitude}&radius=${queryParams.radius}`;
      }
      
      // Add session token for billing optimization
      const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      url += `&sessiontoken=${sessionToken}`;

      console.log('🔗 Proxy URL:', url.replace(GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN'));
      
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
        console.log('✅ Places proxy success:', data.predictions?.length || 0, 'results');
        return {
          success: true,
          predictions: data.predictions || [],
          status: data.status
        };
      } else {
        console.warn('⚠️ Places proxy API error:', data.status, data.error_message);
        return {
          success: false,
          error: data.error_message || 'API error',
          status: data.status,
          predictions: []
        };
      }
    } catch (error) {
      console.error('❌ Places proxy failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        predictions: []
      };
    }
  });

export const placeDetailsProxyProcedure = publicProcedure
  .input(z.object({
    placeId: z.string()
  }))
  .query(async ({ input: queryParams }) => {
    try {
      console.log('📍 Place details proxy request for:', queryParams.placeId);
      
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.length < 30) {
        throw new Error('Google Maps API key not configured');
      }

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${queryParams.placeId}&fields=place_id,formatted_address,geometry,name,types&key=${GOOGLE_MAPS_API_KEY}`;
      
      console.log('🔗 Details URL:', url.replace(GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN'));
      
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
        console.log('✅ Place details proxy success:', data.result?.formatted_address);
        return {
          success: true,
          result: data.result,
          status: data.status
        };
      } else {
        console.warn('⚠️ Place details proxy error:', data.status, data.error_message);
        return {
          success: false,
          error: data.error_message || 'API error',
          status: data.status,
          result: null
        };
      }
    } catch (error) {
      console.error('❌ Place details proxy failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        result: null
      };
    }
  });

export default { placesProxy: placesProxyProcedure, placeDetailsProxy: placeDetailsProxyProcedure };