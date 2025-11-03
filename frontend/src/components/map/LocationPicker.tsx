// frontend/src/components/map/LocationPicker.tsx

import { useEffect, useState, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LocationPickerProps {
  value: string;
  onChange: (coordinates: string) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>(() => {
    if (value) {
      const [lat, lng] = value.split(',').map((v) => parseFloat(v.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return { lat: -28.4696, lng: -65.7795 }; // Default: Catamarca
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let isMounted = true;

    const loadLeaflet = async () => {
      try {
        // Dynamically import Leaflet
        const L = (await import('leaflet')).default;

        if (!isMounted) return;

        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Fix default marker icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // Initialize map
        const mapInstance = L.map('location-picker-map').setView(
          [coordinates.lat, coordinates.lng],
          13
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstance);

        // Add initial marker
        const markerInstance = L.marker([coordinates.lat, coordinates.lng], {
          draggable: true,
        }).addTo(mapInstance);

        // Update coordinates when marker is dragged
        markerInstance.on('dragend', (e: any) => {
          const position = e.target.getLatLng();
          const newCoords = { lat: position.lat, lng: position.lng };
          setCoordinates(newCoords);
          onChange(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
        });

        // Add marker on map click
        mapInstance.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          markerInstance.setLatLng([lat, lng]);
          setCoordinates({ lat, lng });
          onChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        });

        mapRef.current = mapInstance;
        markerRef.current = markerInstance;
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mounted]);

  // Update marker position when value changes externally
  useEffect(() => {
    if (markerRef.current && value) {
      const [lat, lng] = value.split(',').map((v) => parseFloat(v.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        markerRef.current.setLatLng([lat, lng]);
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 13);
        }
        setCoordinates({ lat, lng });
      }
    }
  }, [value]);

  if (!mounted) {
    return (
      <Card className="h-[400px] flex items-center justify-center bg-muted">
        <div className="text-center space-y-2">
          <MapPin className="h-12 w-12 text-[#3259B5] mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div id="location-picker-map" className="h-[400px] rounded-lg border shadow-sm" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 text-[#3259B5]" />
        <span>
          Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación. Coordenadas:{' '}
          {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </span>
      </div>
    </div>
  );
}