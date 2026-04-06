// src/Quality.js
import React, { useEffect, useState } from "react";
import { dataAPI } from "./services/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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

// ===================== SectionTable (KEEP ORIGINAL GROWTH TABLE STYLE) =====================
const SectionTable = ({ title, data }) => (
  <div className="bg-white shadow border border-gray-300 rounded-xl w-full overflow-hidden">
    <div className="bg-[#0B66B2] text-white text-center py-1 text-xs sm:text-sm font-semibold">
      {title}
    </div>
    <table className="w-full text-sm text-center table-fixed border-collapse">
      <thead>
        <tr className="bg-blue-100">
          <th className="py-4 px-1">Indikator</th>
          <th className="py-4 px-1">YoY</th>
          <th className="py-4 px-1">YTD</th>
          <th className="py-4 px-1">MoM</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr
            key={idx}
            className={`${idx % 2 === 1 ? "bg-blue-50" : "bg-white"} leading-snug text-gray-800`}
          >
            <td className="py-3 px-1">{row.indikator}</td>
            <td className="py-3 px-1">{row.yoy}</td>
            <td className="py-3 px-1">{row.ytd}</td>
            <td className="py-3 px-1">{row.mom}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ===================== Section Wrapper =====================
const SectionGraph = ({ title, children }) => (
  <div className="bg-white shadow border border-gray-300 rounded-xl w-full">
    <div className="bg-[#0B66B2] text-white text-center rounded-t-xl py-1 text-sm font-semibold">
      {title}
    </div>
    <div className="p-2">{children}</div>
  </div>
);

// ===================== Main Component =====================
const Quality = ({ selectedCabang = "All", selectedUnit = "All" }) => {
  const [summary, setSummary] = useState({
    par: { os: 0, noa: 0, pct: 0 },
    lar: { os: 0, noa: 0, pct: 0 },
    npl: { os: 0, noa: 0, pct: 0 },
  });

  const [growth, setGrowth] = useState({
    noa: { yoy: 0, ytd: 0, mom: 0 },
    os: { yoy: 0, ytd: 0, mom: 0 },
    par: { yoy: 0, ytd: 0, mom: 0 },
    lar: { yoy: 0, ytd: 0, mom: 0 },
    npl: { yoy: 0, ytd: 0, mom: 0 },
  });

  // grafikJam akan berisi array objek { jam: 0..23, par, lar, npl }
  const [grafikJam, setGrafikJam] = useState([]);

  // Format angka
  const formatNumber = (value, isCurrency = false) => {
    const num = Number(value);
    if (!isFinite(num)) return "-";

    if (isCurrency) {
      if (num >= 1_000_000_000_000)
        return (num / 1_000_000_000_000).toFixed(2) + " T";
      if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + " Bn";
      if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + " M";
    }

    return num.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Format persen
  const formatPercent = (value) => {
    const num = Number(value);
    if (!isFinite(num)) return "-";
    return `${num.toFixed(2)}%`;
  };

  // Ambil data dari backend
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await dataAPI.getSummary({
          cabang: selectedCabang !== "All" ? selectedCabang : undefined,
          unit: selectedUnit !== "All" ? selectedUnit : undefined,
        });

        const data = res.data || {};
        setSummary({
          par: {
            os: Number(data.card_os_par) || 0,
            noa: Number(data.card_noa_par) || 0,
            pct: Number(data.card_pct_par) || 0,
          },
          lar: {
            os: Number(data.card_os_lar) || 0,
            noa: Number(data.card_noa_lar) || 0,
            pct: Number(data.card_pct_lar) || 0,
          },
          npl: {
            os: Number(data.card_os_npl) || 0,
            noa: Number(data.card_noa_npl) || 0,
            pct: Number(data.card_pct_npl) || 0,
          },
        });
      } catch (err) {
        console.error("[ERROR] Error fetching summary:", err);
      }
    };

    const fetchGrowth = async () => {
      try {
        const res = await dataAPI.getGrowthSummary({
          cabang: selectedCabang !== "All" ? selectedCabang : undefined,
          unit: selectedUnit !== "All" ? selectedUnit : undefined,
        });

        const data = res.data || {};
        setGrowth({
          noa: {
            yoy: Number(data.growth_yoy_noa) || 0,
            ytd: Number(data.growth_ytd_noa) || 0,
            mom: Number(data.growth_mom_noa) || 0,
          },
          os: {
            yoy: Number(data.growth_yoy_os) || 0,
            ytd: Number(data.growth_ytd_os) || 0,
            mom: Number(data.growth_mom_os) || 0,
          },
          par: {
            yoy: Number(data.growth_yoy_par) || 0,
            ytd: Number(data.growth_ytd_par) || 0,
            mom: Number(data.growth_mom_par) || 0,
          },
          lar: {
            yoy: Number(data.growth_yoy_lar) || 0,
            ytd: Number(data.growth_ytd_lar) || 0,
            mom: Number(data.growth_mom_lar) || 0,
          },
          npl: {
            yoy: Number(data.growth_yoy_npl) || 0,
            ytd: Number(data.growth_ytd_npl) || 0,
            mom: Number(data.growth_mom_npl) || 0,
          },
        });
      } catch (err) {
        console.error("[ERROR] Error fetching growth:", err);
      }
    };

    // Ambil grafik jam (toleran terhadap bentuk response)
    const fetchGrafikJam = async () => {
        try {
          const res = await dataAPI.getGrafikJam({
            cabang: selectedCabang !== "All" ? selectedCabang : undefined,
            unit: selectedUnit !== "All" ? selectedUnit : undefined,
          });

          const raw = res.data;
          let arr = [];

          // handle berbagai kemungkinan response
          if (Array.isArray(raw)) {
            arr = raw;
          } else if (raw && Array.isArray(raw.data)) {
            arr = raw.data;
          } else {
            const maybe =
              raw && typeof raw === "object"
                ? Object.values(raw).find((v) => Array.isArray(v))
                : null;
            arr = Array.isArray(maybe) ? maybe : [];
          }

          const months = [
            "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
            "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
          ];

          const year = 2025;

          const filled = months.map((m, i) => {
            const found = arr.find((d) => {
              const date = new Date(d.tanggal);
              return date.getMonth() === i && date.getFullYear() === year;
            });

            return {
              label: `${m} 25`,
              par: Number(found?.par ?? 0),
              lar: Number(found?.lar ?? 0),
              npl: Number(found?.npl ?? 0),
            };
          });

          setGrafikJam(filled);

        } catch (err) {
          console.error("[ERROR] Error fetching grafik:", err);
          setGrafikJam([]);
        }
      };

    fetchSummary();
    fetchGrowth();
    fetchGrafikJam();
  }, [selectedCabang, selectedUnit]);

  return (
    <div className="font-sans bg-white min-h-screen px-6 pb-6">
      {/* Baris 1: Kualitas & Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <CardGroup
          title="Kualitas"
          col={3}
          items={[
            { label: "NoA PAR", value: formatNumber(summary.par.noa) },
            { label: "OS PAR", value: formatNumber(summary.par.os, true) },
            { label: "% PAR", value: formatPercent(summary.par.pct) },
            { label: "NoA LAR", value: formatNumber(summary.lar.noa) },
            { label: "OS LAR", value: formatNumber(summary.lar.os, true) },
            { label: "% LAR", value: formatPercent(summary.lar.pct) },
            { label: "NoA NPL", value: formatNumber(summary.npl.noa) },
            { label: "OS NPL", value: formatNumber(summary.npl.os, true) },
            { label: "% NPL", value: formatPercent(summary.npl.pct) },
          ]}
        />

        {/* Growth table - TIDAK DIUBAH tampilannya */}
        <SectionTable
          title="Growth"
          data={[
            {
              indikator: "NOA",
              yoy: formatPercent(growth.noa.yoy),
              ytd: formatPercent(growth.noa.ytd),
              mom: formatPercent(growth.noa.mom),
            },
            {
              indikator: "OS",
              yoy: formatPercent(growth.os.yoy),
              ytd: formatPercent(growth.os.ytd),
              mom: formatPercent(growth.os.mom),
            },
            {
              indikator: "PAR",
              yoy: formatPercent(growth.par.yoy),
              ytd: formatPercent(growth.par.ytd),
              mom: formatPercent(growth.par.mom),
            },
            {
              indikator: "LAR",
              yoy: formatPercent(growth.lar.yoy),
              ytd: formatPercent(growth.lar.ytd),
              mom: formatPercent(growth.lar.mom),
            },
            {
              indikator: "NPL",
              yoy: formatPercent(growth.npl.yoy),
              ytd: formatPercent(growth.npl.ytd),
              mom: formatPercent(growth.npl.mom),
            },
          ]}
        />
      </div>

      {/* Baris 2: Card ringkas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <CardGroup
          title="PAR"
          col={2}
          items={[
            { label: "NoA PAR", value: formatNumber(summary.par.noa) },
            { label: "OS PAR", value: formatNumber(summary.par.os, true) },
          ]}
        />
        <CardGroup
          title="LAR"
          col={2}
          items={[
            { label: "NoA LAR", value: formatNumber(summary.lar.noa) },
            { label: "OS LAR", value: formatNumber(summary.lar.os, true) },
          ]}
        />
        <CardGroup
          title="NPL"
          col={2}
          items={[
            { label: "NoA NPL", value: formatNumber(summary.npl.noa) },
            { label: "OS NPL", value: formatNumber(summary.npl.os, true) },
          ]}
        />
      </div>

      {/* Baris 3: Grafik TREND (FIX) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* PAR */}
        <SectionGraph title="Grafik PAR">
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={grafikJam}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                interval={1}
              />
              <YAxis tickFormatter={(v) => formatNumber(v, true)} 
                style={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) =>
                  new Intl.NumberFormat("id-ID").format(Number(value))
                }
                labelFormatter={(label) => `Tanggal ${label}`}
              />
              <Area
                type="monotone"
                dataKey="par"
                stroke="#0B66B2"
                fill="#0B66B2"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </SectionGraph>

        {/* LAR */}
        <SectionGraph title="Grafik LAR">
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={grafikJam}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={1}/>
              <YAxis tickFormatter={(v) => formatNumber(v, true)} 
                style={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) =>
                  new Intl.NumberFormat("id-ID").format(Number(value))
                }
                labelFormatter={(label) => `Tanggal ${label}`}
              />
              <Area
                type="monotone"
                dataKey="lar"
                stroke="#0B66B2"
                fill="#0B66B2"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </SectionGraph>

        {/* NPL */}
        <SectionGraph title="Grafik NPL">
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={grafikJam}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={1}/>
              <YAxis tickFormatter={(v) => formatNumber(v, true)} 
                style={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) =>
                  new Intl.NumberFormat("id-ID").format(Number(value))
                }
                labelFormatter={(label) => `Tanggal ${label}`}
              />
              <Area
                type="monotone"
                dataKey="npl"
                stroke="#0B66B2"
                fill="#0B66B2"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </SectionGraph>

      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm pt-6">© 2025 Monitoring Dashboard MBU</footer>
    </div>
  );
};

export default Quality;