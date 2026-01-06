import React, { useState } from "react";
import { MultiSelect } from "react-multi-select-component";

const FilterDropdown = ({ cabangList = [], unitList = [] }) => {
  const [selectedCabang, setSelectedCabang] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [searchCabang, setSearchCabang] = useState("");
  const [searchUnit, setSearchUnit] = useState("");

  // Filter data berdasarkan input pencarian
  const filteredCabang = cabangList.filter((item) =>
    item.nama.toLowerCase().includes(searchCabang.toLowerCase())
  );
  const filteredUnit = unitList.filter((item) =>
    item.nama.toLowerCase().includes(searchUnit.toLowerCase())
  );

  return (
    <div>
      {/* Cabang */}
      <div style={{ marginBottom: "12px" }}>
        <label>Cabang:</label>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="text"
            placeholder="Cari cabang..."
            value={searchCabang}
            onChange={(e) => setSearchCabang(e.target.value)}
          />
          <select
            value={selectedCabang}
            onChange={(e) => setSelectedCabang(e.target.value)}
          >
            <option value="">-- Pilih Cabang --</option>
            {filteredCabang.map((item, index) => (
              <option key={index} value={item.nama}>
                {item.nama}
              </option>
            ))}
          </select>
          {selectedCabang && (
            <button onClick={() => setSelectedCabang("")} className="px-2 py-1 text-red-600 hover:text-red-800 font-bold">×</button>
          )}
        </div>
      </div>

      {/* Unit */}
      <div style={{ marginBottom: "12px" }}>
        <label>Unit:</label>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="text"
            placeholder="Cari unit..."
            value={searchUnit}
            onChange={(e) => setSearchUnit(e.target.value)}
          />
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            <option value="">-- Pilih Unit --</option>
            {filteredUnit.map((item, index) => (
              <option key={index} value={item.nama}>
                {item.nama}
              </option>
            ))}
          </select>
          {selectedUnit && (
            <button onClick={() => setSelectedUnit("")} className="px-2 py-1 text-red-600 hover:text-red-800 font-bold">×</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterDropdown;
