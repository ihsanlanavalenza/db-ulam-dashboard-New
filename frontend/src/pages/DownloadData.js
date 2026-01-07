// frontend/src/pages/DownloadData.js
import React, { useState, useEffect } from 'react';
import { dataAPI } from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DownloadData = () => {
  const [cabangList, setCabangList] = useState([]);
  const [unitList, setUnitList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    cabang: '',
    unit: '',
    startDate: '',
    endDate: ''
  });

  const [selectedTables, setSelectedTables] = useState({
    summarymonthly: true,
    realtime: false,
    grafiklive: false
  });

  // Fetch dropdown options
  useEffect(() => {
    dataAPI.getFilters()
      .then((res) => {
        setCabangList(res.data.cabang || []);
        setUnitList(res.data.unit || []);
      })
      .catch((err) => console.error('Error fetching filters:', err));
  }, []);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleTableSelect = (tableName) => {
    setSelectedTables({
      ...selectedTables,
      [tableName]: !selectedTables[tableName]
    });
  };

  const fetchDataForExport = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      
      // Fetch data based on selected tables
      const promises = [];
      const tableData = {};

      if (selectedTables.summarymonthly) {
        promises.push(
          dataAPI.getDataForExport('summarymonthly', params)
            .then(res => { tableData.summarymonthly = res.data; })
        );
      }

      if (selectedTables.realtime) {
        promises.push(
          dataAPI.getDataForExport('realtime', params)
            .then(res => { tableData.realtime = res.data; })
        );
      }

      if (selectedTables.grafiklive) {
        promises.push(
          dataAPI.getDataForExport('grafiklive', params)
            .then(res => { tableData.grafiklive = res.data; })
        );
      }

      await Promise.all(promises);
      setLoading(false);
      return tableData;
    } catch (error) {
      setLoading(false);
      alert('Error fetching data: ' + (error.response?.data?.message || error.message));
      return null;
    }
  };

  const downloadCSV = async () => {
    const data = await fetchDataForExport();
    if (!data) return;

    Object.keys(data).forEach(tableName => {
      const rows = data[tableName];
      if (!rows || rows.length === 0) return;

      // Create CSV content
      const headers = Object.keys(rows[0]);
      let csv = headers.join(',') + '\n';

      rows.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] === null || row[header] === undefined ? '' : row[header];
          // Escape quotes and wrap in quotes if contains comma
          return String(value).includes(',') ? `"${String(value).replace(/"/g, '""')}"` : value;
        });
        csv += values.join(',') + '\n';
      });

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${tableName}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    alert('CSV files downloaded successfully!');
  };

  const downloadPDF = async () => {
    const data = await fetchDataForExport();
    if (!data) return;

    const doc = new jsPDF('landscape');
    let yPosition = 20;

    Object.keys(data).forEach((tableName, index) => {
      const rows = data[tableName];
      if (!rows || rows.length === 0) return;

      if (index > 0) {
        doc.addPage();
        yPosition = 20;
      }

      // Add title
      doc.setFontSize(16);
      doc.text(`Data: ${tableName.toUpperCase()}`, 14, yPosition);
      yPosition += 10;

      // Add filters info
      doc.setFontSize(10);
      const filterText = [];
      if (filters.cabang) filterText.push(`Cabang: ${filters.cabang}`);
      if (filters.unit) filterText.push(`Unit: ${filters.unit}`);
      if (filters.startDate) filterText.push(`Start: ${filters.startDate}`);
      if (filters.endDate) filterText.push(`End: ${filters.endDate}`);
      
      if (filterText.length > 0) {
        doc.text(filterText.join(' | '), 14, yPosition);
        yPosition += 10;
      }

      // Prepare table data
      const headers = Object.keys(rows[0]);
      const tableData = rows.map(row => headers.map(h => row[h] ?? ''));

      // Add table
      autoTable(doc, {
        startY: yPosition,
        head: [headers],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [11, 102, 178] },
        margin: { top: 10 }
      });
    });

    doc.save(`export_${new Date().toISOString().split('T')[0]}.pdf`);
    alert('PDF downloaded successfully!');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Download Data</h1>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Filter Data</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cabang</label>
              <select
                name="cabang"
                value={filters.cabang}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Cabang</option>
                {cabangList.map((cabang, idx) => (
                  <option key={idx} value={cabang}>{cabang}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
              <select
                name="unit"
                value={filters.unit}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Unit</option>
                {unitList.map((unit, idx) => (
                  <option key={idx} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Akhir</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Pilih Data yang Akan Didownload</h2>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTables.summarymonthly}
                onChange={() => handleTableSelect('summarymonthly')}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">Summary Monthly Data</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTables.realtime}
                onChange={() => handleTableSelect('realtime')}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">Realtime ULaMM Data</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTables.grafiklive}
                onChange={() => handleTableSelect('grafiklive')}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">Grafik Live ULaMM Data</span>
            </label>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Download</h2>
          
          <div className="flex gap-4">
            <button
              onClick={downloadCSV}
              disabled={loading || !Object.values(selectedTables).some(v => v)}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download CSV</span>
                </>
              )}
            </button>

            <button
              onClick={downloadPDF}
              disabled={loading || !Object.values(selectedTables).some(v => v)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>

          {!Object.values(selectedTables).some(v => v) && (
            <p className="mt-4 text-sm text-red-600">
              * Pilih minimal satu tabel untuk didownload
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadData;
