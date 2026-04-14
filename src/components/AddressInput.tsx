import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, Crosshair, Home, Building, Map } from 'lucide-react';
import { toast } from 'sonner';

interface Address {
  streetAddress: string;
  apartment: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  fullAddress?: string;
}

interface AddressInputProps {
  onAddressChange: (address: Address) => void;
  initialAddress?: Partial<Address>;
  required?: boolean;
}

const AddressInput = ({ 
  onAddressChange, 
  initialAddress = {},
  required = false 
}: AddressInputProps) => {
  const [address, setAddress] = useState<Address>({
    streetAddress: initialAddress.streetAddress || '',
    apartment: initialAddress.apartment || '',
    city: initialAddress.city || '',
    state: initialAddress.state || '',
    postalCode: initialAddress.postalCode || '',
    country: initialAddress.country || 'India',
    latitude: initialAddress.latitude,
    longitude: initialAddress.longitude,
    fullAddress: initialAddress.fullAddress || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof Address, value: string) => {
    const newAddress = { ...address, [field]: value };
    
    // Generate full address when any field changes
    const fullAddress = generateFullAddress(newAddress);
    newAddress.fullAddress = fullAddress;
    
    setAddress(newAddress);
    onAddressChange(newAddress);
  };

  const generateFullAddress = (addr: Address): string => {
    const parts = [];
    if (addr.streetAddress) parts.push(addr.streetAddress);
    if (addr.apartment) parts.push(addr.apartment);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.postalCode) parts.push(addr.postalCode);
    if (addr.country && addr.country !== 'India') parts.push(addr.country);
    
    return parts.join(', ');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          
          if (!response.ok) {
            throw new Error('Geocoding failed');
          }
          
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            const newAddress: Address = {
              streetAddress: `${addr.house_number || ''} ${addr.road || ''}`.trim(),
              apartment: addr.suburb || addr.neighbourhood || '',
              city: addr.city || addr.town || addr.village || '',
              state: addr.state || '',
              postalCode: addr.postcode || '',
              country: addr.country || 'India',
              latitude,
              longitude,
              fullAddress: data.display_name || ''
            };
            
            setAddress(newAddress);
            onAddressChange(newAddress);
            toast.success('Location detected and address filled!');
          } else {
            toast.error('Unable to get address for your location');
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          toast.error('Failed to get address from location');
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
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
        <CardTitle className="flex items-center gap-2 text-black">
          <MapPin className="h-5 w-5" />
          Address Information
          {required && <span className="text-red-500">*</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location Button */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
            Use Current Location
          </Button>
        </div>

        {/* Address Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="streetAddress">
              Street Address {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="streetAddress"
                value={address.streetAddress}
                onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                placeholder="123 Main Street"
                className="pl-10"
                required={required}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="apartment">Apartment/Suite (Optional)</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="apartment"
                value={address.apartment}
                onChange={(e) => handleInputChange('apartment', e.target.value)}
                placeholder="Apt 4B, Suite 100"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="city">
              City {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="city"
              value={address.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Mumbai"
              required={required}
            />
          </div>

          <div>
            <Label htmlFor="state">
              State {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="state"
              value={address.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="Maharashtra"
              required={required}
            />
          </div>

          <div>
            <Label htmlFor="postalCode">
              Postal Code {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="postalCode"
              value={address.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              placeholder="400001"
              required={required}
            />
          </div>

          <div>
            <Label htmlFor="country">
              Country {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="country"
              value={address.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="India"
              required={required}
            />
          </div>
        </div>

        {/* Full Address Preview */}
        {address.fullAddress && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <Map className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Complete Address:</p>
                <p className="text-sm text-muted-foreground">{address.fullAddress}</p>
                {address.latitude && address.longitude && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Coordinates: {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AddressInput;
