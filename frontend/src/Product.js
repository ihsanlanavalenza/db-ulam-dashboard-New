// src/Product.js
import React, { useEffect, useState } from "react";
import { dataAPI } from "./services/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "./index.css";

// ===================== CardGroup =====================
const CardGroup = ({ title, items, col = 2 }) => {
  return (
    <div
      className="w-full bg-gradient-to-br from-white via-[#f0f0f0] to-gray-200
      border border-gray-300 rounded-xl p-[1px] shadow-[4px_4px_10px_rgba(0,0,0,0.1)]"
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
              : ""
          } gap-2 px-2 py-2`}
        >
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-center">
              <div
                className="w-full h-[60px] sm:h-[80px] border border-[#0B66B2] rounded-md 
                bg-gradient-to-br from-white to-[#e6f0fa]
                shadow-inner flex flex-col justify-center items-center"
              >
                <div className="text-xs sm:text-sm font-bold text-gray-800">
                  {item.value}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-600">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ===================== SectionGraph =====================
const SectionGraph = ({ title, children }) => {
  return (
    <div className="w-full bg-white rounded-xl shadow border">
      <div className="bg-[#0B66B2] text-white text-xs sm:text-sm font-semibold text-center py-1 rounded-t-xl">
        {title}
      </div>
      <div className="p-2 sm:p-4">{children}</div>
    </div>
  );
};

// ===================== JamChart (untuk OS per rentang plafon) =====================
const JamChart = ({ plafond, selectedCabang, selectedUnit }) => {
  const [data, setData] = useState([]);

  // mapping nama field OS dari backend berdasarkan prop plafon
  const getOsKey = (p) => {
    if (p === "50") return "os_50jt";
    if (p === "100") return "os_100jt";
    if (p === "200") return "os_200jt";
    if (p === "400") return "os_400jt";
    return "os_gt400jt"; // "lebih"
  };

  useEffect(() => {
    const fetchJam = async () => {
      try {
        const res = await dataAPI.getGrafikJam({
          cabang: selectedCabang !== "All" ? selectedCabang : undefined,
          unit: selectedUnit !== "All" ? selectedUnit : undefined,
        });

        const raw = Array.isArray(res.data) ? res.data : [];
        const key = getOsKey(plafond);

        // Pastikan jam 0-23 selalu ada
        const filled = Array.from({ length: 24 }, (_, i) => {
          const found = raw.find((d) => Number(d.jam) === i) || {};
          const y = Number(found[key]) || 0;
          return { jam: i, os: y };
        });

        setData(filled);
      } catch (err) {
        console.error("[ERROR] Error fetch grafik jam:", err);
        // fallback kosong 0–23
        setData(Array.from({ length: 24 }, (_, i) => ({ jam: i, os: 0 })));
      }
    };

    fetchJam();
  }, [plafond, selectedCabang, selectedUnit]);

  return (
    <ResponsiveContainer width="100%" height={170}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="jam"
          tick={{ fontSize: 12 }}
          ticks={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(val) =>
            val >= 1_000_000_000
              ? (val / 1_000_000_000).toFixed(1) + "B"
              : val >= 1_000_000
              ? (val / 1_000_000).toFixed(1) + "M"
              : val
          }
        />
        <Tooltip
          formatter={(value) =>
            new Intl.NumberFormat("id-ID").format(Number(value))
          }
          labelFormatter={(label) => `Jam ${label}`}
        />
        <Area type="monotone" dataKey="os" stroke="#0B66B2" fill="#0B66B2" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ===================== Main =====================
const Product = ({ selectedCabang = "All", selectedUnit = "All" }) => {
  const [summary, setSummary] = useState({
    plaf_50: { noa: 0, os: 0 },
    plaf_100: { noa: 0, os: 0 },
    plaf_200: { noa: 0, os: 0 },
    plaf_400: { noa: 0, os: 0 },
    plaf_lebih: { noa: 0, os: 0 },
  });

  // Format angka
  const formatNumber = (value, isCurrency = false) => {
    const num = Number(value);
    if (!isFinite(num)) return "-";

    if (isCurrency) {
      if (num >= 1_000_000_000_000)
        return (num / 1_000_000_000_000).toFixed(2) + " T";
      if (num >= 1_000_000_000)
        return (num / 1_000_000_000).toFixed(2) + " Bn";
      if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + " M";
    }

    return num.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Ambil data summary dari backend
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await dataAPI.getSummary({
          cabang: selectedCabang !== "All" ? selectedCabang : undefined,
          unit: selectedUnit !== "All" ? selectedUnit : undefined,
        });

        const data = res.data || {};

        setSummary({
          plaf_50: {
            noa: Number(data.card_noa_plafond_50jt) || 0,
            os: Number(data.card_os_plafond_50jt) || 0,
          },
          plaf_100: {
            noa: Number(data.card_noa_plafond_51_100jt) || 0,
            os: Number(data.card_os_plafond_51_100jt) || 0,
          },
          plaf_200: {
            noa: Number(data.card_noa_plafond_101_200jt) || 0,
            os: Number(data.card_os_plafond_101_200jt) || 0,
          },
          plaf_400: {
            noa: Number(data.card_noa_plafond_201_400jt) || 0,
            os: Number(data.card_os_plafond_201_400jt) || 0,
          },
          plaf_lebih: {
            noa: Number(data.card_noa_plafond_lebih_400jt) || 0,
            os: Number(data.card_os_plafond_lebih_400jt) || 0,
          },
        });
      } catch (err) {
        console.error("[ERROR] Error fetching product summary:", err);
      }
    };

    fetchSummary();
  }, [selectedCabang, selectedUnit]);

  return (
    <div className="font-sans bg-white min-h-screen px-6 pb-6">
      {/* Baris 1: 2 card + grafik */}
      <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <CardGroup
            title="Plafond < 50jt"
            col={2}
            items={[
              { label: "NoA", value: formatNumber(summary.plaf_50.noa) },
              { label: "OS", value: formatNumber(summary.plaf_50.os, true) },
            ]}
          />
          <SectionGraph title="JAM < 50jt">
            <JamChart
              plafond="50"
              selectedCabang={selectedCabang}
              selectedUnit={selectedUnit}
            />
          </SectionGraph>
        </div>
        <div className="flex flex-col gap-4">
          <CardGroup
            title="Plafond 51 - 100jt"
            col={2}
            items={[
              { label: "NoA", value: formatNumber(summary.plaf_100.noa) },
              { label: "OS", value: formatNumber(summary.plaf_100.os, true) },
            ]}
          />
          <SectionGraph title="JAM 51 - 100jt">
            <JamChart
              plafond="100"
              selectedCabang={selectedCabang}
              selectedUnit={selectedUnit}
            />
          </SectionGraph>
        </div>
      </div>

      {/* Baris 2: 3 card + grafik */}
      <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="flex flex-col gap-4">
          <CardGroup
            title="Plafond 101 - 200jt"
            col={2}
            items={[
              { label: "NoA", value: formatNumber(summary.plaf_200.noa) },
              { label: "OS", value: formatNumber(summary.plaf_200.os, true) },
            ]}
          />
          <SectionGraph title="JAM 101 - 200jt">
            <JamChart
              plafond="200"
              selectedCabang={selectedCabang}
              selectedUnit={selectedUnit}
            />
          </SectionGraph>
        </div>
        <div className="flex flex-col gap-4">
          <CardGroup
            title="Plafond 201 - 400jt"
            col={2}
            items={[
              { label: "NoA", value: formatNumber(summary.plaf_400.noa) },
              { label: "OS", value: formatNumber(summary.plaf_400.os, true) },
            ]}
          />
          <SectionGraph title="JAM 201 - 400jt">
            <JamChart
              plafond="400"
              selectedCabang={selectedCabang}
              selectedUnit={selectedUnit}
            />
          </SectionGraph>
        </div>
        <div className="flex flex-col gap-4">
          <CardGroup
            title="Plafond > 400jt"
            col={2}
            items={[
              { label: "NoA", value: formatNumber(summary.plaf_lebih.noa) },
              { label: "OS", value: formatNumber(summary.plaf_lebih.os, true) },
            ]}
          />
          <SectionGraph title="JAM > 400jt">
            <JamChart
              plafond="lebih"
              selectedCabang={selectedCabang}
              selectedUnit={selectedUnit}
            />
          </SectionGraph>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm pt-6">
        © 2025 Monitoring Dashboard MBU
      </footer>
    </div>
  );
};

export default Product;