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
            <Popup>{loc.NAMA_UNIT}</Popup>
            </Marker>
        );
        })}
    </MapContainer>
  );
};

export default MapComponent;
