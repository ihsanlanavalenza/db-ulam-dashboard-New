// src/TrenQuality.js
import React, { useEffect, useState } from "react";
import { dataAPI } from "./services/api";
import {
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  ResponsiveContainer,
} from "recharts";
import "./index.css";

// ===================== CardGroup =====================
const CardGroup = ({ title, items, col = 2, className = "" }) => {
  return (
    <div
      className={`w-full max-w-full sm:max-w-[500px] bg-gradient-to-br from-white via-[#f0f0f0] to-gray-200
      border border-gray-300 rounded-xl p-[1px] shadow-[4px_4px_10px_rgba(0,0,0,0.1)] ${className}`}
    >
      <div className="bg-white rounded-xl h-full">
        <div className="bg-[#0B66B2] text-white text-center rounded-t-xl py-1 text-xs sm:text-sm font-semibold">
          {title}
        </div>
        <div
          className="grid gap-2 px-2 py-2"
          style={{ gridTemplateColumns: `repeat(${col}, minmax(0,1fr))` }}
        >
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-center">
              <div
                className="w-full h-[70px] sm:h-[89px] border border-[#0B66B2] rounded-md 
                bg-gradient-to-br from-white to-[#e6f0fa]
                shadow-inner flex flex-col justify-center items-center"
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

// ===================== SectionGraph =====================
const SectionGraph = ({ title, children, className = "" }) => (
  <div
    className={`w-full bg-white rounded-xl shadow border border-gray-300 ${className}`}
  >
    <div className="bg-[#0B66B2] text-white text-xs sm:text-sm font-semibold text-center py-1 rounded-t-xl">
      {title}
    </div>
    <div className="p-2 sm:p-4 h-[250px] sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

// ===================== Main Component =====================
const TrenQuality = ({ selectedCabang = "All", selectedUnit = "All" }) => {
  const [summary, setSummary] = useState({
    par: { noa: 0, os: 0, pct: 0 },
    lar: { noa: 0, os: 0, pct: 0 },
    npl: { noa: 0, os: 0, pct: 0 },
  });

  const [grafik, setGrafik] = useState({
    trend: [],
    top5Par: [],
    top5Lar: [],
    top5Npl: [],
  });

  const formatNumber = (value, isCurrency = false) => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    const number = parseFloat(value);

    if (isCurrency) {
      if (number >= 1_000_000_000_000)
        return (number / 1_000_000_000_000).toFixed(2) + " T";
      if (number >= 1_000_000_000)
        return (number / 1_000_000_000).toFixed(2) + " Bn";
      if (number >= 1_000_000)
        return (number / 1_000_000).toFixed(2) + " M";
    }

    return number.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // ===================== FETCH SUMMARY =====================
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const params = {};
        if (selectedCabang !== "All") params.cabang = selectedCabang;
        if (selectedUnit !== "All") params.unit = selectedUnit;

        const res = await dataAPI.getSummary(params);
        const data = res.data || {};

        setSummary({
          par: {
            noa: Number(data.card_noa_par) || 0,
            os: Number(data.card_os_par) || 0,
            pct: Number(data.card_pct_par) || 0,
          },
          lar: {
            noa: Number(data.card_noa_lar) || 0,
            os: Number(data.card_os_lar) || 0,
            pct: Number(data.card_pct_lar) || 0,
          },
          npl: {
            noa: Number(data.card_noa_npl) || 0,
            os: Number(data.card_os_npl) || 0,
            pct: Number(data.card_pct_npl) || 0,
          },
        });
      } catch (err) {
        console.error("[ERROR] Error fetching summary:", err);
      }
    };
    fetchSummary();
  }, [selectedCabang, selectedUnit]);

  // ===================== FETCH GRAFIK =====================
  useEffect(() => {
    const fetchGrafik = async () => {
      try {
        const params = {};
        if (selectedCabang && selectedCabang !== "All") params.cabang = selectedCabang;
        if (selectedUnit && selectedUnit !== "All") params.unit = selectedUnit;

        const res = await dataAPI.getTrenQualityGrafik(params);
        const data = res.data || {};

        const trend = (data.trend || []).map((d) => ({
          periodeKey: d.periode_date, // 🔥 WAJIB FULL DATE (YYYY-MM-DD)
          OSPAR: Number(d.OSPAR ?? 0),
          OSLAR: Number(d.OSLAR ?? 0),
          OSNPL: Number(d.OSNPL ?? 0),
        }));

        setGrafik({
          trend,
          top5: {
            PAR: (data.top5?.PAR || []).map((d) => ({
              Nama_Cabang: d.cabang || d.Nama_Cabang,
              OSPAR: Number(d.OSPAR ?? d.ospar ?? 0),
            })),
            LAR: (data.top5?.LAR || []).map((d) => ({
              Nama_Cabang: d.cabang || d.Nama_Cabang,
              OSLAR: Number(d.OSLAR ?? d.oslar ?? 0),
            })),
            NPL: (data.top5?.NPL || []).map((d) => ({
              Nama_Cabang: d.cabang || d.Nama_Cabang,
              OSNPL: Number(d.OSNPL ?? d.osnpl ?? 0),
            })),
          },
        });
      } catch (err) {
        console.error("[ERROR] Error fetching grafik:", err);
      }
    };

    fetchGrafik();
  }, [selectedCabang, selectedUnit]);

  // ===================== Formatter =====================
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const xTickFormatter = (periodeKey) => {
    if (!periodeKey) return "-";

    const d = new Date(periodeKey);
    if (isNaN(d)) return "-";

    return `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
  };

  // ===================== FILTER TREND =====================
  const filterTrendByRange = (trend) => {
    return (trend || []).filter((d) => {
      const date = new Date(d.periodeKey);
      return !isNaN(date) && date.getFullYear() === 2025; // 🔥 FIX JAN–DES 2025
    });
  };

  // ===================== RENDER =====================
  return (
    <div className="font-sans bg-white min-h-screen px-6 pb-6">
      {/* ===================== PAR ===================== */}
      <div className="mb-4 grid grid-cols-1 lg:grid-cols-[250px_1.4fr_1fr] gap-4">
        <CardGroup
          title="PAR"
          col={1}
          items={[
            { label: "NoA PAR", value: formatNumber(summary.par.noa) },
            { label: "OS PAR", value: formatNumber(summary.par.os, true) },
            {
              label: "% PAR",
              value: summary.par.pct !== null && summary.par.pct !== undefined
                ? `${parseFloat(summary.par.pct).toFixed(2)}%`
                : "-",
            },
          ]}
        />

        <SectionGraph title="Grafik PAR">
          <ComposedChart
            data={filterTrendByRange(grafik.trend)}
            margin={{ top: 11, right: 10, left: 0, bottom: -10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="periodeKey"
              interval={0}
              height={40}
              tick={{ fontSize: 12 }}
              tickFormatter={xTickFormatter}
            />
            <YAxis
              style={{ fontSize: 12 }}
              tickFormatter={(v) => formatNumber(v, true)}
            />
            <Tooltip
              formatter={(value) => formatNumber(value, true)}
              labelFormatter={xTickFormatter}
            />
            <Bar dataKey="OSPAR" stackId="a" fill="#0B66B2" />
            <Line
              type="monotone"
              dataKey="OSPAR"
              stroke="#0B66B2"
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </SectionGraph>

        <SectionGraph title="TOP 5 PAR Cabang Terkecil">
          <BarChart
            layout="vertical"
            data={grafik.top5?.PAR || []}
            margin={{ top: 11, right: 10, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              style={{ fontSize: 12 }}
              tickFormatter={(v) => formatNumber(v, true)}
            />
            <YAxis
              type="category"
              dataKey="Nama_Cabang"
              style={{ fontSize: 12 }}
              width={100}
            />
            <Tooltip formatter={(value) => formatNumber(value, true)} />
            <Bar dataKey="OSPAR" fill="#0B66B2" />
          </BarChart>
        </SectionGraph>
      </div>

      {/* ===================== LAR ===================== */}
      <div className="mb-4 grid grid-cols-1 lg:grid-cols-[250px_1.4fr_1fr] gap-4">
        <CardGroup
          title="LAR"
          col={1}
          items={[{ label: "NoA LAR", value: formatNumber(summary.lar.noa) },
            { label: "OS LAR", value: formatNumber(summary.lar.os, true) },
            {
              label: "% PAR",
              value: summary.lar.pct !== null && summary.lar.pct !== undefined
                ? `${parseFloat(summary.lar.pct).toFixed(2)}%`
                : "-",
            },
          ]}
        />

        <SectionGraph title="Grafik LAR">
          <ComposedChart
            data={filterTrendByRange(grafik.trend)}
            margin={{ top: 11, right: 10, left: 0, bottom: -10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="periodeKey"
              interval={0}
              height={40}
              tick={{ fontSize: 12 }}
              tickFormatter={xTickFormatter}
            />
            <YAxis
              style={{ fontSize: 12 }}
              tickFormatter={(v) => formatNumber(v, true)}
            />
            <Tooltip
              formatter={(value) => formatNumber(value, true)}
              labelFormatter={xTickFormatter}
            />
            <Bar dataKey="OSLAR" stackId="a" fill="#0B66B2" />
            <Line
              type="monotone"
              dataKey="OSLAR"
              stroke="#0B66B2"
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </SectionGraph>

        <SectionGraph title="TOP 5 LAR Cabang Terkecil">
          <BarChart
            layout="vertical"
            data={grafik.top5?.LAR || []}
            margin={{ top: 11, right: 10, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              style={{ fontSize: 12 }}
              tickFormatter={(v) => formatNumber(v, true)}
            />
            <YAxis
              type="category"
              dataKey="Nama_Cabang"
              style={{ fontSize: 12 }}
              width={100}
            />
            <Tooltip formatter={(value) => formatNumber(value, true)} />
            <Bar dataKey="OSLAR" fill="#0B66B2" />
          </BarChart>
        </SectionGraph>
      </div>

      {/* ===================== NPL ===================== */}
      <div className="mb-4 grid grid-cols-1 lg:grid-cols-[250px_1.4fr_1fr] gap-4">
        <CardGroup
          title="NPL"
          col={1}
          items={[
            { label: "NoA NPL", value: formatNumber(summary.npl.noa) },
            { label: "OS NPL", value: formatNumber(summary.npl.os, true) },
            {
              label: "% PAR",
              value: summary.npl.pct !== null && summary.npl.pct !== undefined
                ? `${parseFloat(summary.npl.pct).toFixed(2)}%`
                : "-",
            },
          ]}
        />

        <SectionGraph title="Grafik NPL">
          <ComposedChart
            data={filterTrendByRange(grafik.trend)}
            margin={{ top: 11, right: 10, left: 0, bottom: -10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="periodeKey"
              interval={0}
              height={40}
              tick={{ fontSize: 12 }}
              tickFormatter={xTickFormatter}
            />
            <YAxis
              style={{ fontSize: 12 }}
              tickFormatter={(v) => formatNumber(v, true)}
            />
            <Tooltip
              formatter={(value) => formatNumber(value, true)}
              labelFormatter={xTickFormatter}
            />
            <Bar dataKey="OSNPL" stackId="a" fill="#0B66B2" />
            <Line
              type="monotone"
              dataKey="OSNPL"
              stroke="#0B66B2"
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </SectionGraph>

        <SectionGraph title="TOP 5 NPL Cabang Terkecil">
          <BarChart
            layout="vertical"
            data={grafik.top5?.NPL || []}
            margin={{ top: 11, right: 10, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              style={{ fontSize: 12 }}
              tickFormatter={(v) => formatNumber(v, true)}
            />
            <YAxis
              type="category"
              dataKey="Nama_Cabang"
              style={{ fontSize: 12 }}
              width={100}
            />
            <Tooltip formatter={(value) => formatNumber(value, true)} />
            <Bar dataKey="OSNPL" fill="#0B66B2" />
          </BarChart>
        </SectionGraph>
      </div>

      <footer className="text-center text-gray-500 text-sm pt-6">
        © 2025 Monitoring Dashboard MBU
      </footer>
    </div>
  );
};

export default TrenQuality;