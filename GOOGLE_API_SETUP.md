# LaundryHub - Google API Integration

This document explains how to integrate Google APIs with your LaundryHub app.

## Google APIs Integrated

The app now includes comprehensive Google API integration with the following services:

### 1. Google Places API
- **Address Autocomplete**: Smart address suggestions as users type
- **Place Details**: Get detailed information about selected places including coordinates
- **Current Location**: Integration with device location services

### 2. Google Maps Static API
- **Static Maps**: Display maps with markers for pickup/dropoff locations
- **Web Compatible**: Works on both mobile and web platforms
- **Custom Markers**: Different colored markers for different location types

### 3. Google Geocoding API
- **Address to Coordinates**: Convert addresses to latitude/longitude
- **Reverse Geocoding**: Convert coordinates back to human-readable addresses

### 4. Google Directions API
- **Route Planning**: Get directions between pickup and dropoff locations
- **Distance & Duration**: Calculate travel time and distance

### 5. Google Distance Matrix API
- **Bulk Distance Calculations**: Find nearby laundry masters efficiently
- **Multiple Origins/Destinations**: Optimize service provider matching

## Setup Instructions

### 1. Get Google API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Places API
   - Maps Static API
   - Geocoding API
   - Directions API
   - Distance Matrix API
4. Create credentials (API Key)
5. Restrict the API key to your app's bundle ID for security

### 2. Configure Environment Variables

Create a `.env` file in your project root and add:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_api_key_here
```

### 3. Update app.json (if needed)

The app is already configured for LaundryHub. If you need to add additional Google Maps configuration:

```json
{
  "expo": {
    "name": "LaundryHub",
    "slug": "laundryhub",
    "ios": {
      "bundleIdentifier": "app.rork.laundryhub",
      "config": {
        "googleMapsApiKey": "YOUR_API_KEY_HERE"
      }
    },
    "android": {
      "package": "app.rork.laundryhub",
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_API_KEY_HERE"
        }
      }
    }
  }
}
```

## Features Implemented

### For Customers
- **Smart Address Input**: Address autocomplete with Google Places API
- **Current Location**: Quick selection of current location for pickup
- **Address Validation**: Ensures valid addresses are selected

### For Laundry Masters
- **Interactive Maps**: View customer locations on Google Maps
- **Directions**: Get directions to pickup locations
- **Distance Calculation**: See distance and estimated travel time

### Web Compatibility
- **Static Maps**: Uses Google Static Maps API for web compatibility
- **Fallback UI**: Graceful degradation when maps aren't available
- **Cross-Platform**: Works on iOS, Android, and web

## Components Created

### 1. GoogleService (`lib/google-service.ts`)
- Centralized service for all Google API calls
- Handles API key management and error handling
- Provides methods for all Google API operations

### 2. GoogleMapView (`components/GoogleMapView.tsx`)
- Reusable map component
- Works on both mobile and web
- Supports custom markers and directions

### 3. AddressAutocomplete (`components/AddressAutocomplete.tsx`)
- Smart address input with autocomplete
- Integrates with Google Places API
- Supports current location selection

## Usage Examples

### Basic Map Display
```tsx
<GoogleMapView
  center={{
    latitude: 37.7749,
    longitude: -122.4194,
    address: "San Francisco, CA"
  }}
  markers={[
    {
      location: { latitude: 37.7749, longitude: -122.4194 },
      title: "Pickup Location",
      color: "blue"
    }
  ]}
  showDirectionsButton={true}
/>
```

### Address Autocomplete
```tsx
<AddressAutocomplete
  placeholder="Enter pickup address"
  onAddressSelect={(address, location) => {
    console.log('Selected:', address, location);
  }}
  userLocation={currentLocation}
  showCurrentLocationButton={true}
/>
```

### Find Nearby Services
```tsx
const nearbyMasters = await googleService.findNearbyLaundryMasters(
  customerLocation,
  allLaundryMasters,
  10 // 10km radius
);
```

## API Costs & Optimization

### Cost Optimization Features
- **Session Tokens**: Used for Places API to reduce billing
- **Static Maps**: More cost-effective than interactive maps for simple displays
- **Debounced Requests**: Address autocomplete waits 300ms before making API calls
- **Caching**: Results are cached where appropriate

### Estimated Costs (as of 2024)
- Places Autocomplete: $2.83 per 1,000 requests
- Place Details: $17 per 1,000 requests
- Static Maps: $2 per 1,000 requests
- Geocoding: $5 per 1,000 requests
- Directions: $5 per 1,000 requests

## Security Best Practices

1. **API Key Restrictions**: Restrict your API key to your app's bundle ID
2. **Environment Variables**: Never commit API keys to version control
3. **Rate Limiting**: Implement client-side rate limiting for API calls
4. **Error Handling**: Graceful fallbacks when API calls fail

## Troubleshooting

### Common Issues

1. **"Google Maps API key not configured"**
   - Check that `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set in your environment
   - Verify the API key is correct and has the necessary permissions

2. **"API key not valid for this application"**
   - Check API key restrictions in Google Cloud Console
   - Ensure the bundle ID matches your app configuration

3. **Maps not loading on web**
   - This is expected - the app uses static maps for web compatibility
   - Static maps will display instead of interactive maps

4. **Address autocomplete not working**
   - Verify Places API is enabled in Google Cloud Console
   - Check that the API key has Places API permissions

## Next Steps

1. **Set up your Google API key** following the instructions above
2. **Test the integration** by trying address autocomplete and map features
3. **Monitor API usage** in Google Cloud Console to track costs
4. **Customize styling** of maps and autocomplete components as needed

The Google API integration is now fully implemented and ready to use! The app will work with fallbacks even without an API key, but you'll get the full experience once configured.