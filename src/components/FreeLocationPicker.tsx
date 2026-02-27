import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, Crosshair } from 'lucide-react';
import { toast } from 'sonner';

interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

interface FreeLocationPickerProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
}

declare global {
  interface Window {
    L: any;
  }
}

const FreeLocationPicker = ({ 
  onLocationSelect, 
  initialLocation
}: FreeLocationPickerProps) => {
  const [location, setLocation] = useState<Location>(initialLocation || { address: '', latitude: 0, longitude: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load Leaflet (OpenStreetMap) when component mounts
  useEffect(() => {
    loadLeafletMap();
  }, []);

  const loadLeafletMap = () => {
    setIsMapLoading(true);
    
    // Check if Leaflet is already loaded
    if (window.L) {
      console.log('Leaflet already loaded');
      setIsMapLoading(false);
      initializeMap();
      return;
    }

    // Load Leaflet CSS and JS
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    const leafletJS = document.createElement('script');
    leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletJS.onload = () => {
      console.log('Leaflet loaded successfully');
      setIsMapLoading(false);
      initializeMap();
    };
    leafletJS.onerror = () => {
      console.error('Failed to load Leaflet');
      toast.error('Failed to load map');
      setIsMapLoading(false);
    };
    document.head.appendChild(leafletJS);
  };

  const initializeMap = () => {
    if (!window.L || !mapRef.current) return;

    console.log('Initializing Leaflet map...');
    
    // Create map
    mapInstanceRef.current = window.L.map(mapRef.current).setView([40.7128, -74.0060], 13);

    // Add OpenStreetMap tiles (free)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    // Add click listener
    mapInstanceRef.current.on('click', (event: any) => {
      const lat = event.latlng.lat;
      const lng = event.latlng.lng;
      console.log('Map clicked:', lat, lng);
      reverseGeocode(lat, lng);
    });

    // Add default marker
    const defaultIcon = window.L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    window.L.marker([40.7128, -74.0060], { icon: defaultIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup('Default Location')
      .openPopup();

    console.log('Leaflet map initialized successfully');
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    console.log('Reverse geocoding:', lat, lng);
    
    try {
      // Use Nominatim API (free geocoding)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      console.log('Geocoding result:', data);
      
      if (data && data.display_name) {
        const address = data.display_name;
        const newLocation = { address, latitude: lat, longitude: lng };
        setLocation(newLocation);
        onLocationSelect(newLocation);
        
        // Update marker
        if (markerRef.current) {
          mapInstanceRef.current.removeLayer(markerRef.current);
        }
        
        const defaultIcon = window.L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });
        
        markerRef.current = window.L.marker([lat, lng], { icon: defaultIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup('Selected Location')
          .openPopup();
        
        console.log('Location set:', address);
      } else {
        toast.error('Unable to get address for your location');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to get address');
    }
  };

  const getCurrentLocation = () => {
    console.log('Getting current location...');
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Got location:', position);
        const { latitude, longitude } = position.coords;
        
        // Center map on current location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15);
        }
        
        // Get address
        reverseGeocode(latitude, longitude);
        setIsLoading(false);
        toast.success('Location found!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLoading(false);
        
        let errorMessage = 'Unable to get your location';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        toast.error(errorMessage);
      }
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={getCurrentLocation}
            disabled={isLoading || isMapLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
            {isMapLoading ? 'Loading Map...' : 'Current Location'}
          </Button>
        </div>
        
        <div 
          ref={mapRef} 
          className="w-full h-64 rounded-lg border bg-gray-100"
          style={{ 
            minHeight: '256px',
            width: '100%',
            height: '256px',
            position: 'relative'
          }}
        >
          {!mapInstanceRef.current && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              {isMapLoading ? 'Loading free map...' : 'Map will appear here'}
            </div>
          )}
        </div>
        
        {location.address && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Selected Location:</p>
            <p className="text-sm text-muted-foreground">{location.address}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </div>
        )}
        
              </CardContent>
    </Card>
  );
};

export default FreeLocationPicker;
