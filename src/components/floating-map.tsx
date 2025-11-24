import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface FloatingMapProps {
  latitude: number;
  longitude: number;
}

export function FloatingMap({ latitude, longitude }: FloatingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    // Initialize map only once
    let map: any;
    
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current || (mapRef.current as any)._leaflet_id) return;

      const L = (await import('leaflet')).default;

      // Re-check if map was initialized during the async import
      if (!mapRef.current || (mapRef.current as any)._leaflet_id) return;

      // Fix icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      map = L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false // Cleaner look for small map
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([latitude, longitude]).addTo(map);
      marker.bindPopup(`
        <div class="text-xs">
          <p class="font-semibold">Your Current Location</p>
          <p>Lat: ${latitude.toFixed(5)}</p>
          <p>Lon: ${longitude.toFixed(5)}</p>
        </div>
      `);

      mapInstanceRef.current = map;
      markerRef.current = marker;
    };

    initMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Update view when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 15);
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.getPopup().setContent(`
        <div class="text-xs">
          <p class="font-semibold">Your Current Location</p>
          <p>Lat: ${latitude.toFixed(5)}</p>
          <p>Lon: ${longitude.toFixed(5)}</p>
        </div>
      `);
    }
  }, [latitude, longitude]);

  return (
    <div className="fixed bottom-6 right-6 z-50 shadow-2xl rounded-lg overflow-hidden border-2 border-white bg-white">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 text-xs font-semibold text-white flex items-center justify-between">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Your Location
        </span>
        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-blue-100 underline ml-2 text-[10px]"
        >
          Open in Maps
        </a>
      </div>
      <div ref={mapRef} className="w-[300px] h-[200px]" />
    </div>
  );
}
