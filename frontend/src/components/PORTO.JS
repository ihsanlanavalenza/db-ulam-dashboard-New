import React, { useEffect, useState } from "react";
import "./index.css";
import { LineChart, LabelList,  XAxis, YAxis,  CartesianGrid,  Line, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CardGroup = ({ title, items, col = 2 }) => (
  <div className="w-full bg-gradient-to-br from-white via-[#f0f0f0] to-gray-200 border border-gray-300 rounded-xl p-[1px] shadow">
    <div className="bg-white rounded-xl">
      <div className="bg-[#0B66B2] text-white text-center rounded-t-xl py-1 text-sm font-semibold">
        {title}
      </div>
      <div className={`grid grid-cols-${col} gap-2 px-2 py-2`}>
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-center">
            <div className="w-full h-[80px] border border-[#0B66B2] rounded-md bg-gradient-to-br from-white to-[#e6f0fa] shadow-inner flex flex-col justify-center items-center">
              <div className="text-sm font-bold text-gray-800">{item.value}</div>
              <div className="text-xs text-gray-600">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SectionGraph = ({ title, children }) => (
  <div className="w-full bg-white rounded-xl shadow border">
    <div className="bg-[#0B66B2] text-white text-sm font-semibold text-center py-1 rounded-t-xl">
      {title}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const Portofolio = ({ selectedCabang = "All", selectedUnit = "All" }) => {
  const [summary, setSummary] = useState({});
  const [dataTrenNoaOs, setDataTrenNoaOs] = useState([]);
  const [dataTrenPenyaluran, setDataTrenPenyaluran] = useState([]);

  // Format angka
  const formatNumber = (value, isCurrency = false) => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    const number = parseFloat(value);

    if (isCurrency) {
      if (number >= 1_000_000_000_000) return (number / 1_000_000_000_000).toFixed(2) + " T";
      if (number >= 1_000_000_000) return (number / 1_000_000_000).toFixed(2) + " Bn";
      if (number >= 1_000_000) return (number / 1_000_000).toFixed(2) + " M";
    }

    return number.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Ambil data summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const params = {};
        if (selectedCabang !== "All") params.cabang = selectedCabang;
        if (selectedUnit !== "All") params.unit = selectedUnit;

        const query = new URLSearchParams(params).toString();
        const url = query
          ? `http://localhost:3001/api/summary?${query}`
          : "http://localhost:3001/api/summary";

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setSummary(data || {});
      } catch (err) {
        console.error("❌ Error fetching summary:", err);
        setSummary({});
      }
    };

    fetchSummary();
  }, [selectedCabang, selectedUnit]);

  // Ambil data grafik
  useEffect(() => {
    fetch("http://localhost:3001/api/grafik-portofolio")
      .then((res) => res.json())
      .then((data) => {
        setDataTrenNoaOs(data.trenNoaOs || []);
        setDataTrenPenyaluran(data.trenPenyaluran || []);
      })
      .catch((err) => console.error("Error fetch grafik portofolio:", err));
  }, []);

  return (
    <div className="font-sans bg-white min-h-screen px-6 pb-6">
      {/* Baris 1 */}
      <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CardGroup
          title="NoA"
          col={1}
          items={[{ label: "NoA", value: formatNumber(summary.noa_konsolidasi) }]}
        />
        <CardGroup
          title="Outstanding"
          col={1}
          items={[{ label: "OS", value: formatNumber(summary.os_konsolidasi, true) }]}
        />
      </div>

      {/* Baris 2 */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardGroup
          title="NoA Penyaluran Bulan Ini"
          col={1}
          items={[{ label: "NoA", value: formatNumber(summary.noa_lending_bulan_ini) }]}
        />
        <CardGroup
          title="Penyaluran Bulan Ini"
          col={1}
          items={[{ label: "Plafond", value: formatNumber(summary.net_lending_bulan_ini, true) }]}
        />
        <CardGroup
          title="NoA Penyaluran Tahun Ini"
          col={1}
          items={[{ label: "NoA", value: formatNumber(summary.noa_lending_tahun_ini) }]}
        />
        <CardGroup
          title="Penyaluran Tahun Ini"
          col={1}
          items={[{ label: "Plafond", value: formatNumber(summary.net_lending_tahun_ini, true) }]}
        />
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tren NoA & OS */}
        <SectionGraph title="Tren NoA & OS">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={dataTrenNoaOs}
              margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="EOM"
                tickFormatter={(str) => {
                  const date = new Date(str);
                  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                }}
                interval={0}
                height={20}
                style={{ fontSize: 12 }}
              />
              <YAxis style={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v, true)} />
              <Tooltip
                formatter={(value) => formatNumber(value, true)}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                }}
              />
              <Legend verticalAlign="top" align="left" height={36} />
              <Line
                type="monotone"
                dataKey="NOA"
                name="NoA"
                stroke="#0B66B2"
                strokeWidth={2}
                dot={{ r: 4, stroke: "#0B66B2", strokeWidth: 2, fill: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="OS"
                name="OS"
                stroke="#7FB3FF"
                strokeWidth={2}
                dot={{ r: 4, stroke: "#7FB3FF", strokeWidth: 2, fill: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </SectionGraph>

        {/* Tren Penyaluran */}
        <SectionGraph title="Tren Penyaluran">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={dataTrenPenyaluran}
              margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="EOM"
                tickFormatter={(str) => {
                  const date = new Date(str);
                  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                }}
                interval={0}
                height={20}
                style={{ fontSize: 12 }}
              />
              <YAxis style={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v, true)} />
              <Tooltip
                formatter={(value) => formatNumber(value, true)}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                }}
              />
              <Legend verticalAlign="top" align="left" height={36} />
              <Line
                type="monotone"
                dataKey="netLending"
                name="Penyaluran"
                stroke="#0B66B2"
                strokeWidth={2}
                dot={{ r: 4, stroke: "#0B66B2", strokeWidth: 2, fill: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </SectionGraph>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm pt-6">
        © 2025 Monitoring Dashboard MBU
      </footer>
    </div>
  );
};

export default Portofolio;
