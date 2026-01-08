import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const MapComponent = ({ locations }) => {
  const defaultCenter = [-2.548926, 118.014863]; // Pusat Indonesia
  const defaultZoom = 5;

  const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return (
    <MapContainer center={defaultCenter} zoom={defaultZoom} className="w-full h-[500px] rounded-lg border z-0">
      <TileLayer
        attribution='© OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc, idx) => {
        const lat = parseFloat(loc.LATITUDE.replace(",", "."));
        const lon = parseFloat(loc.LONGITUDE.replace(",", "."));

        if (isNaN(lat) || isNaN(lon)) return null;

        return (
          <Marker key={idx} position={[lat, lon]} icon={customIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-bold text-base mb-2 text-[#0B66B2]">
                  {loc.NAMA_UNIT}
                </div>
                <div className="space-y-1">
                  <div className="flex items-start">
                    <span className="font-semibold mr-2">📍 Koordinat:</span>
                  </div>
                  <div className="ml-4 text-gray-600">
                    <div>Latitude: {lat.toFixed(6)}</div>
                    <div>Longitude: {lon.toFixed(6)}</div>
                  </div>
                  {loc.NAMA_CABANG && (
                    <div className="mt-2 pt-2 border-t">
                      <span className="font-semibold">Cabang:</span> {loc.NAMA_CABANG}
                    </div>
                  )}
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-3 py-1 bg-[#0B66B2] text-white text-xs rounded hover:bg-[#094d87] transition"
                  >
                    🗺️ Buka di Google Maps
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
        })}
    </MapContainer>
  );
};

export default MapComponent;
