// src/TrenPortofolio.js
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, BarChart, Bar, Area
} from "recharts";
import "./index.css";

const SectionGraph = ({ title, children }) => (
  <div className="w-full bg-white rounded-xl shadow border border-gray-300">
    <div className="bg-[#0B66B2] text-white text-xs sm:text-sm font-semibold text-center py-1 rounded-t-xl">
      {title}
    </div>
    <div className="p-2 sm:p-4">
      {children}
    </div>
  </div>
);

const TrenPortofolio = ({ selectedCabang, selectedUnit }) => {
  const [dataNoA, setDataNoA] = useState([]);
  const [dataOS, setDataOS] = useState([]);
  const [dataNoALending, setDataNoALending] = useState([]);
  const [dataNetLending, setDataNetLending] = useState([]);
  const [dataTop5NoA, setDataTop5NoA] = useState([]);
  const [dataTop5OS, setDataTop5OS] = useState([]);

  const fetchData = useCallback(async () => {
    const cabang = selectedCabang || "All";
    const unit = selectedUnit || "All";

    try {
      const res = await axios.get("http://localhost:3001/api/grafik-tren-portofolio", {
        params: { cabang, unit }
      });

      const summary = Array.isArray(res.data.trenPortofolio_Summary) ? res.data.trenPortofolio_Summary : [];
      const fgl = Array.isArray(res.data.trenPortofolio_FGL) ? res.data.trenPortofolio_FGL : [];
      const top5Noa = Array.isArray(res.data.top5Noa) ? res.data.top5Noa : [];
      const top5OS = Array.isArray(res.data.top5OS) ? res.data.top5OS : [];

      // Pisahkan dataset untuk NoA dan OS
      setDataNoA(
        summary.map(item => ({
          bulan_label: item.bulan_label,
          NoA: Number(item.NoA) || 0
        }))
      );

      setDataOS(
        summary.map(item => ({
          bulan_label: item.bulan_label,
          OS: Number(item.OS) || 0
        }))
      );

      setDataNoALending(
        fgl.map(item => ({
          bulan_label: item.bulan_label,
          NoaLending: Number(item.NoaLending) || 0
        }))
      );

      setDataNetLending(
        fgl.map(item => ({
          bulan_label: item.bulan_label,
          NetLending: Number(item.NetLending) || 0
        }))
      );

      setDataTop5NoA(top5Noa);
      setDataTop5OS(top5OS);
    } catch (err) {
      console.error("[ERROR] Error fetching grafik tren portofolio:", err);
    }
  }, [selectedCabang, selectedUnit]);

  useEffect(() => {
    fetchData();
  }, [selectedCabang, selectedUnit, fetchData]);

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

  return (
    <div className="font-sans bg-white min-h-screen px-6 pb-6">
      {/* BARIS 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <SectionGraph title="NoA">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dataNoA} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan_label" interval={0} height={30} style={{ fontSize: 12 }} />
              <YAxis style={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v, true)} />
              <Tooltip formatter={(v) => formatNumber(v)} />
              <Area type="monotone" dataKey="NoA" fill="#bbdefb" stroke="none" />
              <Line type="monotone" dataKey="NoA" stroke="#0B66B2" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </SectionGraph>

        <SectionGraph title="OS">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dataOS} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan_label" interval={0} height={30} style={{ fontSize: 12 }} />
              <YAxis style={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v, true)} />
              <Tooltip formatter={(v) => formatNumber(v, true)} />
              <Area type="monotone" dataKey="OS" fill="#bbdefb" stroke="none" />
              <Line type="monotone" dataKey="OS" stroke="#0B66B2" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </SectionGraph>
      </div>

      {/* BARIS 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <SectionGraph title="NoA Lending">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataNoALending} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan_label" interval={0} height={30} style={{ fontSize: 12 }} />
              <YAxis style={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(v) => formatNumber(v)} />
              <Bar dataKey="NoaLending" fill="#0B66B2" />
            </BarChart>
          </ResponsiveContainer>
        </SectionGraph>

        <SectionGraph title="Net Lending">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataNetLending} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan_label" interval={0} height={30} style={{ fontSize: 12 }} />
              <YAxis style={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v, true)} />
              <Tooltip formatter={(v) => formatNumber(v, true)} />
              <Bar dataKey="NetLending" fill="#0B66B2" />
            </BarChart>
          </ResponsiveContainer>
        </SectionGraph>
      </div>

      {/* BARIS 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <SectionGraph title="TOP 5 NoA">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataTop5NoA} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" style={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v)} />
              <YAxis dataKey="Cabang" type="category" style={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatNumber(v)} />
              <Bar dataKey="total_noa" fill="#0B66B2" />
            </BarChart>
          </ResponsiveContainer>
        </SectionGraph>

        <SectionGraph title="TOP 5 Outstanding">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataTop5OS} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" style={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v, true)} />
              <YAxis dataKey="Cabang" type="category" style={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatNumber(v, true)} />
              <Bar dataKey="total_os" fill="#0B66B2" />
            </BarChart>
          </ResponsiveContainer>
        </SectionGraph>
      </div>

      <footer className="text-center text-gray-500 text-sm pt-6">
        © 2025 Monitoring Dashboard MBU
      </footer>
    </div>
  );
};

export default TrenPortofolio;
