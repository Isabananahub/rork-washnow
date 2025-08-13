import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MapPin, Search, X } from 'lucide-react-native';
import { googleService, PlaceAutocomplete } from '@/lib/google-service';
import { LocationData } from '@/lib/location-service';
import Colors from '@/constants/colors';

interface AddressAutocompleteProps {
  placeholder?: string;
  value?: string;
  onAddressSelect: (address: string, location?: LocationData) => void;
  onChangeText?: (text: string) => void;
  userLocation?: LocationData;
  style?: any;
  inputStyle?: any;
  disabled?: boolean;
  showCurrentLocationButton?: boolean;
}

export default function AddressAutocomplete({
  placeholder = 'Enter address',
  value = '',
  onAddressSelect,
  onChangeText,
  userLocation,
  style,
  inputStyle,
  disabled = false,
  showCurrentLocationButton = true,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState<string>(value);
  const [suggestions, setSuggestions] = useState<PlaceAutocomplete[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    setError('');
    
    if (onChangeText) {
      onChangeText(text);
    }

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300) as ReturnType<typeof setTimeout>;
  };

  const fetchSuggestions = async (query: string) => {
    try {
      setIsLoading(true);
      setError('');

      if (!googleService.isConfigured()) {
        console.log('🔧 Google Places API not configured, using fallback suggestions');
        const results = await googleService.getPlaceAutocomplete(query, userLocation, 50000);
        setSuggestions(results);
        setShowSuggestions(true);
        return;
      }

      console.log('🔍 Searching Google Places for:', query);
      const results = await googleService.getPlaceAutocomplete(
        query,
        userLocation,
        50000 // 50km radius
      );

      console.log('✅ Found', results.length, 'address suggestions');
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('❌ Address autocomplete error:', error);
      // Try to get fallback suggestions even on error
      try {
        const fallbackResults = await googleService.getPlaceAutocomplete(query, userLocation, 50000);
        setSuggestions(fallbackResults);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
        setError('Unable to load address suggestions. Please enter address manually.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = async (suggestion: PlaceAutocomplete) => {
    try {
      setInputValue(suggestion.description);
      setShowSuggestions(false);
      setSuggestions([]);
      inputRef.current?.blur();

      // Check if this is a fallback suggestion
      if (suggestion.place_id.startsWith('fallback_')) {
        console.log('📝 Using fallback address:', suggestion.structured_formatting.main_text);
        // For fallback suggestions, just use the description as the address
        const cleanAddress = suggestion.structured_formatting.main_text;
        onAddressSelect(cleanAddress);
        return;
      }

      // Get detailed place information including coordinates for real Google Places
      if (googleService.isConfigured()) {
        console.log('📍 Getting place details for:', suggestion.place_id);
        const placeDetails = await googleService.getPlaceDetails(suggestion.place_id);
        
        if (placeDetails) {
          console.log('✅ Place details received:', placeDetails.formatted_address);
          const location: LocationData = {
            latitude: placeDetails.geometry.location.lat,
            longitude: placeDetails.geometry.location.lng,
            address: placeDetails.formatted_address,
          };
          onAddressSelect(placeDetails.formatted_address, location);
          return;
        }
      }
      
      // Fallback to just using the description
      console.log('⚠️ Using description as fallback:', suggestion.description);
      onAddressSelect(suggestion.description);
    } catch (error) {
      console.error('❌ Error handling suggestion selection:', error);
      onAddressSelect(suggestion.description);
    }
  };

  const handleCurrentLocationPress = () => {
    if (userLocation?.address) {
      setInputValue(userLocation.address);
      setShowSuggestions(false);
      onAddressSelect(userLocation.address, userLocation);
      inputRef.current?.blur();
    }
  };

  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (onChangeText) {
      onChangeText('');
    }
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (inputValue.trim().length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for suggestion press
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputContainer, inputStyle]}>
        <Search size={20} color={Colors.light.gray} />
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder={placeholder}
          value={inputValue}
          onChangeText={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          placeholderTextColor={Colors.light.gray}
          autoCorrect={false}
          autoCapitalize="words"
        />
        
        {isLoading && (
          <ActivityIndicator size="small" color={Colors.light.primary} />
        )}
        
        {inputValue.length > 0 && !isLoading && (
          <TouchableOpacity onPress={clearInput} style={styles.clearButton}>
            <X size={16} color={Colors.light.gray} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView 
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {showCurrentLocationButton && userLocation?.address && (
              <TouchableOpacity
                style={[styles.suggestionItem, styles.currentLocationItem]}
                onPress={handleCurrentLocationPress}
              >
                <MapPin size={16} color={Colors.light.primary} />
                <View style={styles.suggestionContent}>
                  <Text style={styles.currentLocationText}>Use current location</Text>
                  <Text style={styles.suggestionSecondary} numberOfLines={1}>
                    {userLocation.address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={suggestion.place_id}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <MapPin size={16} color={Colors.light.gray} />
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionMain} numberOfLines={1}>
                    {suggestion.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.suggestionSecondary} numberOfLines={1}>
                    {suggestion.structured_formatting.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    ...Platform.select({
      web: {
        outlineWidth: 0,
      },
    }),
  },
  clearButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.error,
    marginTop: 4,
    marginLeft: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    zIndex: 1001,
    maxHeight: 300,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currentLocationItem: {
    backgroundColor: Colors.light.primaryBackground,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionMain: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  suggestionSecondary: {
    fontSize: 14,
    color: Colors.light.gray,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 2,
  },
});