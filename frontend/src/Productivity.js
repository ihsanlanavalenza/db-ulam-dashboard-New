import React, { useEffect, useState } from "react";
import { dataAPI } from "./services/api";
import "./index.css";
import { LineChart,  XAxis, CartesianGrid,  Line, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CardGroup = ({ title, items, col = 2 }) => (
  <div className="w-full bg-gradient-to-br from-white via-[#f0f0f0] to-gray-200 border border-gray-300 rounded-xl p-[1px] shadow">
    <div className="bg-white rounded-xl">
      <div className="bg-[#0B66B2] text-white text-center rounded-t-xl py-1 text-xs sm:text-sm font-semibold">
        {title}
      </div>
      <div className={`grid ${col === 2 ? 'grid-cols-2' : col === 3 ? 'grid-cols-2 sm:grid-cols-3' : `grid-cols-${col}`} gap-2 px-2 py-2`}>
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-center">
            <div className="w-full h-[60px] sm:h-[80px] border border-[#0B66B2] rounded-md bg-gradient-to-br from-white to-[#e6f0fa] shadow-inner flex flex-col justify-center items-center">
              <div className="text-xs sm:text-sm font-bold text-gray-800">{item.value}</div>
              <div className="text-[10px] sm:text-xs text-gray-600">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SectionGraph = ({ title, children }) => (
  <div className="w-full bg-white rounded-xl shadow border border-gray-300">
    <div className="bg-[#0B66B2] text-white text-xs sm:text-sm font-semibold text-center py-1 rounded-t-xl">
      {title}
    </div>
    <div className="p-2 sm:p-4">{children}</div>
  </div>
);

const Productivity = ({ selectedCabang = "All", selectedUnit = "All" }) => {
  const [summary, setSummary] = useState(null);
  const [dataAOM, setDataAOM] = useState([]);
  const [dataUnit, setDataUnit] = useState([]);

  // Parsing bulan dari format "Jan 25" atau "January 2025"
  const parseMonth = (str) => {
    if (typeof str !== "string") {
      console.warn("parseMonth: expected string but got", str);
      return new Date(0); // fallback ke 1 Jan 1970 supaya tidak error
    }
    const [mon, yr] = str.split(" ");
    const yearNum = yr.length === 2 ? `20${yr}` : yr;
    return new Date(`01 ${mon} ${yearNum}`);
  };

  // Ambil data summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const params = {};
        if (selectedCabang && selectedCabang !== "All") params.cabang = selectedCabang;
        if (selectedUnit && selectedUnit !== "All") params.unit = selectedUnit;

        const res = await dataAPI.getSummary(params);
        const data = res.data;

        setSummary({
          avg_os_per_nasabah: data.avg_os_per_nasabah || 0,
          ospar_per_noapar: data.ospar_per_noapar || 0,
          oslar_per_noalar: data.oslar_per_noalar || 0,
          osnpl_per_noanpl: data.osnpl_per_noanpl || 0,
          kpi_noa: data.kpi_noa || 0,
          kpi_noa_per_aom: data.kpi_noa_per_aom || 0,
          kpi_noa_per_unit: data.kpi_noa_per_unit || 0,
          kpi_os: data.kpi_os || 0,
          kpi_os_per_aom: data.kpi_os_per_aom || 0,
          kpi_os_per_unit: data.kpi_os_per_unit || 0,
        });
      } catch (err) {
        console.error("[ERROR] Error fetching summary:", err);
        setSummary(null);
      }
    };

    fetchSummary();
  }, [selectedCabang, selectedUnit]);

  // Ambil grafik productivity (12 bulan terakhir otomatis)
  useEffect(() => {
    const fetchGrafik = async () => {
      try {
        const params = {};
        if (selectedCabang && selectedCabang !== "All") params.cabang = selectedCabang;
        if (selectedUnit && selectedUnit !== "All") params.unit = selectedUnit;

        const res = await dataAPI.getProductivityGrafik(params);

        const now = new Date();

        // fetchGrafik bagian filter & setState
        const filteredAOM = (res.data?.aom || [])
          .filter(item => typeof item.bulan_label === "string" && item.bulan_label.trim() !== "")
          .filter(item => parseMonth(item.bulan_label) <= now)
          .sort((a, b) => parseMonth(a.bulan_label) - parseMonth(b.bulan_label));

        const filteredUnit = (res.data?.unit || [])
          .filter(item => typeof item.bulan_label === "string" && item.bulan_label.trim() !== "")
          .filter(item => parseMonth(item.bulan_label) <= now)
          .sort((a, b) => parseMonth(a.bulan_label) - parseMonth(b.bulan_label));

        const yearFilter = 2025;

        const aom2025 = filteredAOM.filter(item => {
          const date = parseMonth(item.bulan_label);
          return date.getFullYear() === yearFilter;
        });

        const unit2025 = filteredUnit.filter(item => {
          const date = parseMonth(item.bulan_label);
          return date.getFullYear() === yearFilter;
        });

        const sortByMonth = (a, b) => parseMonth(a.bulan_label) - parseMonth(b.bulan_label);

        setDataAOM(aom2025.sort(sortByMonth));
        setDataUnit(unit2025.sort(sortByMonth));

      } catch (err) {
        console.error("[ERROR] Error fetching grafik-productivity:", err);
        setDataAOM([]);
        setDataUnit([]);
      }
    };

    fetchGrafik();
  }, [selectedCabang, selectedUnit]);

  const formatNumber = (value, isCurrency = false) => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    const number = parseFloat(value);

    if (isCurrency) {
      if (number >= 1_000_000_000_000) return (number / 1_000_000_000_000).toFixed(2) + " T";
      if (number >= 1_000_000_000) return (number / 1_000_000_000).toFixed(2) + " Bn";
      if (number >= 1_000_000) return (number / 1_000_000).toFixed(2) + " M";
      if (number >= 1_000) return (number / 1_000).toFixed(2) + " K";
    }

    return number.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="font-sans bg-white min-h-screen px-6 pb-6">
      {/* Portofolio */}
      <div className="mb-4">
        <CardGroup
          title="Portofolio"
          col={4}
          items={[
            { label: "Avg OS / Nasabah", value: formatNumber(summary?.avg_os_per_nasabah, true) },
            { label: "OS PAR / NOA PAR", value: formatNumber(summary?.ospar_per_noapar, true) },
            { label: "OS LAR / NOA LAR", value: formatNumber(summary?.oslar_per_noalar, true) },
            { label: "OS NPL / NOA NPL", value: formatNumber(summary?.osnpl_per_noanpl, true) },
          ]}
        />
      </div>

      {/* KPI */}
      <div className="mb-4">
        <CardGroup
          title="KPI Produktivitas"
          col={3}
          items={[
            { label: "NoA", value: formatNumber(summary?.kpi_noa) },
            { label: "NoA / AOM", value: formatNumber(summary?.kpi_noa_per_aom) },
            { label: "NoA / Unit", value: formatNumber(summary?.kpi_noa_per_unit) },
            { label: "OS", value: formatNumber(summary?.kpi_os, true) },
            { label: "OS / AOM", value: formatNumber(summary?.kpi_os_per_aom, true) },
            { label: "OS / Unit", value: formatNumber(summary?.kpi_os_per_unit, true) },
          ]}
        />
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Grafik AOM */}
        <SectionGraph title="Portofolio per AOM">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={dataAOM}
              margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="bulan_label"
                tickFormatter={(str) => {
                  const date = parseMonth(str);
                  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                }}
                interval={0}
                height={20}
                style={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => formatNumber(value, true)}
                labelFormatter={(label) => {
                  const date = parseMonth(label);
                  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                }}
              />
              <Legend verticalAlign="top" align="left" height={36} />
              <Line
                type="monotone"
                dataKey="NoA_AOM"
                name="NoA / AOM"
                stroke="#0B66B2"
                strokeWidth={2}
                dot={{ r: 3, stroke: "#0B66B2", strokeWidth: 2, fill: "#fff" }}
              >
              </Line>
              <Line
                type="monotone"
                dataKey="OS_AOM"
                name="OS / AOM"
                stroke="#7FB3FF"
                strokeWidth={2}
                dot={{ r: 3, Stroke: "#7FB3FF", strokeWidth: 2, fill: "#fff" }}
              >
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </SectionGraph>

        {/* Grafik Unit */}
        <SectionGraph title="Portofolio per Unit">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={dataUnit}
              margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="bulan_label"
                tickFormatter={(str) => {
                  const date = parseMonth(str);
                  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                }}
                interval={0}
                height={20}
                style={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => formatNumber(value, true)}
                labelFormatter={(label) => {
                  const date = parseMonth(label);
                  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                }}
              />
              <Legend verticalAlign="top" align="left" height={36} /> 
              <Line
                type="monotone"
                dataKey="NoA_Unit"
                name="NoA / Unit"
                stroke="#0B66B2"
                strokeWidth={2}
                dot={{ r: 3, stroke: "#0B66B2", strokeWidth: 2, fill: "#fff" }}
              >
              </Line>
              <Line
                type="monotone"
                dataKey="OS_Unit"
                name="OS / Unit"
                stroke="#7FB3FF"
                strokeWidth={2}
                dot={{ r: 3, stroke: "#7FB3FF", strokeWidth: 2, fill: "#fff" }}
              >
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </SectionGraph>
      </div>

      <footer className="text-center text-gray-500 text-sm pt-6">
        © 2025 Monitoring Dashboard MBU
      </footer>
    </div>
  );
};

export default Productivity;