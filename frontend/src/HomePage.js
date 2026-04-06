// src/HomePage.js
import { dataAPI } from "./services/api";
import "./index.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const CardGroup = ({ title, items, col = 2, className = "" }) => {
  const isCompactCard = ["Sisa Hari Kerja", "Unit", "Total Pendamping"].includes(title);
  const isExpandedContent = ["Kualitas", "Pendamping"].includes(title);

  return (
    <div
      className={`bg-gradient-to-br from-white via-[#f0f0f0] to-gray-200 border border-gray-300 rounded-xl p-[1px] shadow-[4px_4px_10px_rgba(0,0,0,0.1)] ${className}`}
    >
      <div className="bg-white rounded-xl">
        <div className="bg-[#0B66B2] text-white text-center rounded-t-xl py-1 text-xs sm:text-sm font-semibold">
          {title}
        </div>
        <div
          className={`grid ${
            col === 1
              ? "grid-cols-1"
              : col === 2
              ? "grid-cols-2"
              : col === 3
              ? "grid-cols-2 sm:grid-cols-3"
              : col === 4
              ? "grid-cols-2 sm:grid-cols-4"
              : ""
          } gap-2 px-2 py-2`}
        >
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-center">
              <div
                className={`w-full border border-[#0B66B2] rounded-md bg-gradient-to-br from-white to-[#e6f0fa] shadow-inner flex flex-col items-center justify-center ${
                  isCompactCard
                    ? "h-[80px] sm:h-[108px]"
                    : isExpandedContent
                    ? "h-[70px] sm:h-[93px]"
                    : "h-[60px] sm:h-[80px]"
                }`}
              >
                <div className="text-xs sm:text-sm font-bold text-gray-800">{item.value}</div>
                <div className="text-[10px] sm:text-xs text-gray-600">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// FlyToFiltered component di HomePage.js
const FlyToFiltered = ({ data }) => {
  const map = useMap();
  useEffect(() => {
    if (data.length > 0) {
      const latLngs = data.map((d) => [d.latitude, d.longitude]);
      map.flyToBounds(latLngs, {
        padding: [60, 60], // bisa dikecilkan untuk memperbesar zoom
        maxZoom: 50,        // tambahkan atau sesuaikan ini untuk membatasi zoom maksimal
      });
    }
  }, [data, map]);
  return null;
};

// Custom Marker Icon
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const HomePage = ({ selectedCabang = "", selectedUnit = "" }) => {
  const [locations, setLocations] = useState([]);
  const [summary, setSummary] = useState(null);

  // Fetch lokasi cabang/unit
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await dataAPI.getBranchLocations({
          cabang: selectedCabang,
          unit: selectedUnit,
        });
        const valid = res.data
          .filter((l) => l.LATITUDE && l.LONGITUDE)
          .map((l) => ({
            latitude: parseFloat(l.LATITUDE),
            longitude: parseFloat(l.LONGITUDE),
            nama_unit: l.NAMA_UNIT || "-",
            nama_cabang: l.NAMA_CABANG || "-",
          }));
        setLocations(valid);
      } catch (err) {
        console.error("[ERROR] Error fetching location data:", err);
      }
    };
    fetchLocations();
  }, [selectedCabang, selectedUnit]);

  useEffect(() => {
    const fetchAllSummary = async () => {
      try {
        const params = {};

        if (selectedCabang !== "All") params.cabang = selectedCabang;
        if (selectedUnit !== "All") params.unit = selectedUnit;

        console.log("PARAMS HOMEPAGE:", params);

        const [resSummary, resLending] = await Promise.all([
          dataAPI.getSummary(params),
          dataAPI.getSummaryLending(params),
        ]);

        console.log("PARAMS:", params);
        console.log("RESPONSE SUMMARY:", resSummary.data);
        console.log("RESPONSE LENDING:", resLending.data);

        const data = resSummary.data || {};
        const lending = resLending.data || {};

        setSummary({
          noa_konsolidasi: data.noa_konsolidasi || 0,
          os_konsolidasi: data.os_konsolidasi || 0,
          noa_ulamm: data.noa_ulamm || 0,
          os_ulamm: data.os_ulamm || 0,
          noa_km200: data.noa_km200 || 0,
          os_km200: data.os_km200 || 0,

          os_par: data.os_par || 0,
          os_npl: data.os_npl || 0,
          os_lar: data.os_lar || 0,
          noa_par: data.noa_par || 0,
          noa_npl: data.noa_npl || 0,
          noa_lar: data.noa_lar || 0,

          aom: data.aom || 0,
          aom_pantas: data.aom_pantas || 0,
          kam: data.kam || 0,
          kuu: data.kuu || 0,
          sisa_hari_kerja: data.sisa_hari_kerja || 0,
          total_unit: data.total_unit || 0,
          total_pendamping: data.total_pendamping || 0,

          net_lending_bulan_ini: lending.net_lending_bulan_ini || 0,
          noa_lending_bulan_ini: lending.noa_lending_bulan_ini || 0,
          net_lending_tahun_ini: lending.net_lending_tahun_ini || 0,
          noa_lending_tahun_ini: lending.noa_lending_tahun_ini || 0,
        });

      } catch (err) {
        console.error("[ERROR] Error fetching summary:", err);
        setSummary({});
      }
    };

    fetchAllSummary();
  }, [selectedCabang, selectedUnit]);

const formatNumber = (value, isCurrency = false) => {
  if (value === null || value === undefined || isNaN(value)) return "-";

  const number = parseFloat(value);

  if (isCurrency) {
    if (number >= 1_000_000_000_000) {
      return (number / 1_000_000_000_000).toFixed(2) + " T";
    } else if (number >= 1_000_000_000) {
      return (number / 1_000_000_000).toFixed(2) + " Bn";
    } else if (number >= 1_000_000) {
      return (number / 1_000_000).toFixed(2) + " M";
    }
  }

  return number.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

return (
  <div className="font-sans bg-white min-h-screen">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 px-3 sm:px-6 pt-3 sm:pt-4">
      <CardGroup
        title="Konsolidasi"
        col={2}
        items={[
          { label: "NoA", value: formatNumber(summary?.noa_konsolidasi) },
          { label: "OS", value: formatNumber(summary?.os_konsolidasi, true) },
        ]}
      />

      <CardGroup
        title="ULaMM"
        col={2}
        items={[
          { label: "NoA", value: formatNumber(summary?.noa_ulamm) },
          { label: "OS", value: formatNumber(summary?.os_ulamm, true) },
        ]}
      />

      <CardGroup
        title="KM200"
        col={2}
        items={[
          { label: "NoA", value: formatNumber(summary?.noa_km200) },
          { label: "OS", value: formatNumber(summary?.os_km200, true) },
        ]}
      />

      <CardGroup
        title="Lending Bulan Ini"
        col={2}
        items={[
          { label: "Net Lending", value: formatNumber(summary?.net_lending_bulan_ini, true) },
          { label: "NoA Lending", value: formatNumber(summary?.noa_lending_bulan_ini) },
        ]}
      />

      <CardGroup
        title="Lending Tahun Ini"
        col={2}
        items={[
          { label: "Net Lending", value: formatNumber(summary?.net_lending_tahun_ini, true) },
          { label: "NoA Lending", value: formatNumber(summary?.noa_lending_tahun_ini) },
        ]}
      />
    </div>

      {/* MAP & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 px-3 sm:px-6 mt-3 sm:mt-4 pb-4 sm:pb-6">
        {/* Map */}
        <div className="lg:col-span-6 h-full rounded-xl overflow-hidden">
          <MapContainer
            center={[-2.5489, 118.0149]}
            zoom={5}
            style={{ height: "350px", width: "100%" }}
            className="sm:!h-[450px] lg:!h-[500px]"
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <FlyToFiltered data={locations} />
            {locations.map((loc, i) => (
                <Marker
                  key={i}
                  position={[loc.latitude, loc.longitude]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-bold text-base mb-2 text-[#0B66B2]">
                        {loc.nama_unit}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-start">
                          <span className="font-semibold mr-2">📍 Koordinat:</span>
                        </div>
                        <div className="ml-4 text-gray-600">
                          <div>Latitude: {loc.latitude.toFixed(6)}</div>
                          <div>Longitude: {loc.longitude.toFixed(6)}</div>
                        </div>
                        {loc.nama_cabang && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="font-semibold">Cabang:</span> {loc.nama_cabang}
                        </div>
                      )}
                      <a
                        href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 px-3 py-1 bg-[#0B66B2] text-xs rounded hover:bg-[#094d87] transition"
                        style={{ color: "white" }}
                      >
                        🗺️ Buka di Google Maps
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Kualitas & Pendamping */}
        <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-4">
          <CardGroup
            title="Kualitas"
            col={3}
            className="w-full"
            items={[
              { label: "OS PAR", value: formatNumber(summary?.os_par, true) },
              { label: "OS NPL", value: formatNumber(summary?.os_npl, true) },
              { label: "OS LAR", value: formatNumber(summary?.os_lar, true) },
              { label: "NoA PAR", value: formatNumber(summary?.noa_par) },
              { label: "NoA NPL", value: formatNumber(summary?.noa_npl) },
              { label: "NoA LAR", value: formatNumber(summary?.noa_lar) },
            ]}
          />
          <CardGroup
            title="Pendamping"
            col={2}
            className="w-full"
            items={[
              { label: "AOM", value: formatNumber(summary?.aom) },
              { label: "AOM Pantas", value: formatNumber(summary?.aom_pantas) },
              { label: "KAM", value: formatNumber(summary?.kam) },
              { label: "KUU", value: formatNumber(summary?.kuu) },
            ]}
          />
        </div>

        {/* Sisa Hari Kerja, Unit, Total Pendamping */}
        <div className="lg:col-span-2 grid grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4">
          <CardGroup
            title="Sisa Hari Kerja"
            className="w-full"
            col={1}
            items={[{ label: "Hari", value: formatNumber(summary?.sisa_hari_kerja) }]}
          />
          <CardGroup
            title="Unit"
            className="w-full"
            col={1}
            items={[{ label: "Unit", value: formatNumber(summary?.total_unit) }]}
          />
          <CardGroup
            title="Total Pendamping"
            className="w-full"
            col={1}
            items={[{ label: "Pendamping", value: formatNumber(summary?.total_pendamping) }]}
          />
        </div>
      </div>

      <footer className="text-center text-gray-500 text-sm py-4">
        © 2025 Monitoring Dashboard MBU
      </footer>
    </div>
  );
};

export default HomePage;