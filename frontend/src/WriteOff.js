// src/WriteOff.js
import React, { useEffect, useState } from "react";
import { dataAPI } from "./services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import "./index.css";

// ===================== FORMAT ANGKA =====================
const formatNumber = (value, isCurrency = false, isInteger = false) => {
  if (value === null || value === undefined || isNaN(value)) return "-";

  let number = parseFloat(value);

  if (isCurrency) {
    if (number >= 1_000_000_000_000)
      return (number / 1_000_000_000_000).toFixed(2) + " T";
    if (number >= 1_000_000_000)
      return (number / 1_000_000_000).toFixed(2) + " Bn";
    if (number >= 1_000_000)
      return (number / 1_000_000).toFixed(2) + " M";
  }

  if (isInteger) number = Math.floor(number);

  return number.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// ===================== CARD COMPONENT =====================
const CardGroup = ({ title, items, col = 2 }) => {
  return (
    <div className="w-full bg-gradient-to-br from-white via-[#f0f0f0] to-gray-200 border border-gray-300 rounded-xl p-[1px] shadow">
      <div className="bg-white rounded-xl">
        <div className="bg-[#0B66B2] text-white text-center rounded-t-xl py-1 text-xs sm:text-sm font-semibold">
          {title}
        </div>
        <div className={`grid ${col === 2 ? 'grid-cols-2' : col === 3 ? 'grid-cols-2 sm:grid-cols-3' : `grid-cols-${col}`} gap-2 px-2 py-2`}>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-center">
              <div className="w-full h-[60px] sm:h-[80px] border border-[#0B66B2] rounded-md bg-gradient-to-br from-white to-[#e6f0fa] shadow-inner flex flex-col justify-center items-center">
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

// ===================== SECTION GRAPH COMPONENT =====================
const SectionGraph = ({ title, children }) => {
  return (
    <div className="w-full bg-white rounded-xl shadow border border-gray-300">
      <div className="bg-[#0B66B2] text-white text-xs sm:text-sm font-semibold text-center py-1 rounded-t-xl">
        {title}
      </div>
      <div className="p-2 sm:p-4 min-h-[250px] sm:min-h-[350px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

// ===================== WRITE OFF PAGE =====================
// Dummy agar grafik + card langsung render
const dummySummary = {
  card_total_wo: 0,
  card_pct_wo: 0,
  card_noa_wo: 0,
  card_recovery_pokok: 0,
  card_recovery_bunga: 0,
  card_avg_hari_menunggak: 0,
};

const dummyData = {
  lineChart: [
    { bulan: "2025-01", total_noa: 0 },
    { bulan: "2025-02", total_noa: 0 },
    { bulan: "2025-03", total_noa: 0 },
  ],
  topCab: [
    { CAB: "Cabang A", total_noa: 0 },
    { CAB: "Cabang B", total_noa: 0 },
    { CAB: "Cabang C", total_noa: 0 },
  ],
  topUnit: [
    { nama_unit: "Unit A", total_noa: 0 },
    { nama_unit: "Unit B", total_noa: 0 },
    { nama_unit: "Unit C", total_noa: 0 },
  ],
};

const WriteOff = ({ selectedCabang = "All", selectedUnit = "All" }) => {
  const [summaryWO, setSummaryWO] = useState(dummySummary);
  const [grafikWO, setGrafikWO] = useState(dummyData);

  // Fetch data paralel → overwrite dummy
  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = {};
        if (selectedCabang !== "All") params.cabang = selectedCabang;
        if (selectedUnit !== "All") params.unit = selectedUnit;

        const [resSummary, resGrafik] = await Promise.all([
          dataAPI.getSummaryWO(params),
          dataAPI.getGrafikWriteoff(params),
        ]);

        setSummaryWO(resSummary.data || dummySummary);
        setGrafikWO(resGrafik.data || dummyData);
      } catch (err) {
        console.error("[ERROR] Error fetching WO data:", err);
      }
    };
    fetchData();
  }, [selectedCabang, selectedUnit]);

  // Daftar card WO
  const woCards = [
    { label: "Total WO", value: formatNumber(summaryWO.card_total_wo, true) },
    { label: "% Pinjaman WO", value: `${formatNumber(summaryWO.card_pct_wo)} %` },
    { label: "Total NoA WO", value: formatNumber(summaryWO.card_noa_wo) },
    { label: "Recovery Pokok", value: formatNumber(summaryWO.card_recovery_pokok, true) },
    { label: "Recovery Bunga", value: formatNumber(summaryWO.card_recovery_bunga, true) },
    {
      label: "Avg Hari Menunggak",
      value: formatNumber(summaryWO.card_avg_hari_menunggak, false, true),
    },
  ];

  return (
    <div className="font-sans bg-white min-h-screen px-6 pb-6">
      {/* Card WO */}
      <div className="mb-4 grid grid-cols-6 lg:grid-cols-1 gap-4">
        <CardGroup title="WO Nasabah" col={6} items={woCards} />
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line Chart */}
        <SectionGraph title="NoA">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={grafikWO.lineChart.map((item) => ({
                ...item,
                bulan_label: new Date(item.bulan + "-01").toLocaleString("id-ID", {
                  month: "short",
                  year: "numeric",
                }),
              }))}
              margin={{ top: 11, right: 30, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan_label" tick={{ fontSize: 12 }} interval={0} />
              <YAxis 
                tickFormatter={(v) => formatNumber(v, true)}
                style={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(v) => formatNumber(v, true)}
                labelFormatter={(l) => `Bulan: ${l}`}
              />
              <Line type="monotone" dataKey="total_noa" stroke="#0B66B2" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </SectionGraph>

        <div className="grid grid-cols-2 gap-4">
          {/* Bar Chart Cabang */}
          <SectionGraph title="TOP 5 Cabang PNM WO Tahun Ini">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={grafikWO.topCab}
                layout="vertical"
                margin={{ top: 11, right: 10, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  style={{ fontSize: 12 }}
                  tickFormatter={(v) => formatNumber(v, true)}
                />
                <YAxis dataKey="CAB" type="category" style={{ fontSize: 12 }} width={100} />
                <Tooltip formatter={(v) => formatNumber(v, true)} />
                <Bar dataKey="total_noa" fill="#0B66B2" />
              </BarChart>
            </ResponsiveContainer>
          </SectionGraph>

          {/* Bar Chart Unit */}
          <SectionGraph title="TOP 5 Unit PNM WO Tahun Ini">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={grafikWO.topUnit}
                layout="vertical"
                margin={{ top: 11, right: 10, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  style={{ fontSize: 12 }}
                  tickFormatter={(v) => formatNumber(v, true)}
                />
                <YAxis dataKey="nama_unit" type="category" style={{ fontSize: 12 }} width={120} />
                <Tooltip formatter={(v) => formatNumber(v, true)} />
                <Bar dataKey="total_noa" fill="#0B66B2" />
              </BarChart>
            </ResponsiveContainer>
          </SectionGraph>
        </div>
      </div>

      <footer className="text-center text-gray-500 text-sm pt-6">
        © 2025 Monitoring Dashboard MBU
      </footer>
    </div>
  );
};

export default WriteOff;