import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Image, TouchableOpacity, Alert } from 'react-native';
import { LocationData } from '@/lib/location-service';
import { googleService } from '@/lib/google-service';
import { MapPin, Navigation, ExternalLink } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface MapMarker {
  location: LocationData;
  title?: string;
  description?: string;
  color?: 'red' | 'blue' | 'green' | 'yellow';
  label?: string;
}

interface GoogleMapViewProps {
  center: LocationData;
  markers?: MapMarker[];
  zoom?: number;
  height?: number;
  showDirectionsButton?: boolean;
  onMarkerPress?: (marker: MapMarker) => void;
  style?: any;
}

export default function GoogleMapView({
  center,
  markers = [],
  zoom = 15,
  height = 200,
  showDirectionsButton = false,
  onMarkerPress,
  style,
}: GoogleMapViewProps) {
  const [staticMapUrl, setStaticMapUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const generateMap = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Check if Google Maps API is configured
        const apiKey = googleService.getApiKey();
        console.log('🗺️ GoogleMapView API Key check:', apiKey ? 'Available' : 'Not available');
        
        if (!googleService.isConfigured()) {
          console.warn('⚠️ Google Maps API not configured for map view');
          setError('Google Maps API not configured');
          setIsLoading(false);
          return;
        }

        const mapMarkers = markers.map((marker, index) => ({
          location: marker.location,
          label: marker.label || String.fromCharCode(65 + index),
          color: marker.color || 'red',
        }));

        // Add center marker if no markers provided
        if (mapMarkers.length === 0) {
          mapMarkers.push({
            location: center,
            label: 'A',
            color: 'red',
          });
        }

        const url = googleService.getStaticMapUrl(
          center,
          zoom,
          '400x300',
          mapMarkers
        );

        setStaticMapUrl(url);
      } catch (err) {
        console.error('Error generating static map:', err);
        setError('Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    generateMap();
  }, [center, markers, zoom]);



  const openInGoogleMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${center.latitude},${center.longitude}`,
      android: `geo:0,0?q=${center.latitude},${center.longitude}`,
      web: `https://www.google.com/maps/search/?api=1&query=${center.latitude},${center.longitude}`,
    });

    if (url) {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        // For mobile, you would use Linking.openURL(url)
        Alert.alert('Open in Maps', `Would open: ${url}`);
      }
    }
  };

  const getDirections = () => {
    const url = Platform.select({
      ios: `maps:0,0?daddr=${center.latitude},${center.longitude}`,
      android: `google.navigation:q=${center.latitude},${center.longitude}`,
      web: `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`,
    });

    if (url) {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        Alert.alert('Get Directions', `Would open: ${url}`);
      }
    }
  };

  const handleMarkerPress = (marker: MapMarker) => {
    if (onMarkerPress) {
      onMarkerPress(marker);
    } else {
      Alert.alert(
        marker.title || 'Location',
        marker.description || `${marker.location.latitude.toFixed(4)}, ${marker.location.longitude.toFixed(4)}`
      );
    }
  };

  if (error) {
    return (
      <View style={[styles.container, { height }, style]}>
        <View style={styles.errorContainer}>
          <MapPin size={32} color={Colors.light.gray} />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.coordinatesText}>
            📍 {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}
          </Text>
          {center.address && (
            <Text style={styles.addressText}>{center.address}</Text>
          )}
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { height }, style]}>
        <View style={styles.loadingContainer}>
          <MapPin size={32} color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }, style]}>
      {staticMapUrl ? (
        <TouchableOpacity 
          style={styles.mapContainer} 
          onPress={openInGoogleMaps}
          activeOpacity={0.8}
        >
          <Image 
            source={{ uri: staticMapUrl }} 
            style={styles.mapImage}
            resizeMode="cover"
          />
          <View style={styles.mapOverlay}>
            <TouchableOpacity style={styles.overlayButton} onPress={openInGoogleMaps}>
              <ExternalLink size={16} color="white" />
              <Text style={styles.overlayButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.fallbackContainer}>
          <MapPin size={32} color={Colors.light.primary} />
          <Text style={styles.fallbackText}>Map view</Text>
          <Text style={styles.coordinatesText}>
            📍 {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      {/* Markers info */}
      {markers.length > 0 && (
        <View style={styles.markersContainer}>
          {markers.map((marker, index) => (
            <TouchableOpacity
              key={index}
              style={styles.markerInfo}
              onPress={() => handleMarkerPress(marker)}
            >
              <View style={[styles.markerDot, { backgroundColor: getMarkerColor(marker.color) }]}>
                <Text style={styles.markerLabel}>
                  {marker.label || String.fromCharCode(65 + index)}
                </Text>
              </View>
              <View style={styles.markerDetails}>
                <Text style={styles.markerTitle} numberOfLines={1}>
                  {marker.title || 'Location'}
                </Text>
                {marker.description && (
                  <Text style={styles.markerDescription} numberOfLines={1}>
                    {marker.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Directions button */}
      {showDirectionsButton && (
        <TouchableOpacity style={styles.directionsButton} onPress={getDirections}>
          <Navigation size={16} color="white" />
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const getMarkerColor = (color?: string): string => {
  switch (color) {
    case 'blue': return '#007AFF';
    case 'green': return '#34C759';
    case 'yellow': return '#FFCC00';
    case 'red':
    default: return '#FF3B30';
  }
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.light.lightGray,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  overlayButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.gray,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.gray,
    textAlign: 'center',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: 16,
    color: Colors.light.gray,
    textAlign: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    color: Colors.light.gray,
    textAlign: 'center',
  },
  addressText: {
    fontSize: 12,
    color: Colors.light.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  markersContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    maxHeight: 100,
  },
  markerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  markerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markerDetails: {
    flex: 1,
  },
  markerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  markerDescription: {
    fontSize: 12,
    color: '#666',
  },
  directionsButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  directionsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});