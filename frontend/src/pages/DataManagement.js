// frontend/src/pages/DataManagement.js
import React, { useState, useEffect } from 'react';
import { dataManagementAPI, dataAPI } from '../services/api';

const DataManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  
  // Filters
  const [cabangList, setCabangList] = useState([]);
  const [unitList, setUnitList] = useState([]);
  const [filters, setFilters] = useState({
    cabang: '',
    unit: '',
    startDate: '',
    endDate: ''
  });
  
  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    periode: '',
    cabang: '',
    namaUnit: '',
    noa: '',
    os: '',
    osPar: '',
    osNpl: '',
    osLar: ''
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

  // Fetch transactions
  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };
      
      const res = await dataManagementAPI.getTransactions(params);
      
      if (res.data.success) {
        setTransactions(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert('Gagal memuat data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters.cabang, filters.unit, filters.startDate, filters.endDate]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dataManagementAPI.createTransaction(formData);
      alert('Data berhasil ditambahkan!');
      setShowModal(false);
      setFormData({
        periode: '',
        cabang: '',
        namaUnit: '',
        noa: '',
        os: '',
        osPar: '',
        osNpl: '',
        osLar: ''
      });
      fetchTransactions();
    } catch (error) {
      alert('Gagal menambah data: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    
    try {
      const id = `${row.Periode}|${row.cabang}|${row.NamaUnit}`;
      await dataManagementAPI.deleteTransaction(encodeURIComponent(id));
      alert('Data berhasil dihapus!');
      fetchTransactions();
    } catch (error) {
      alert('Gagal menghapus data: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'Rp 0';
    return 'Rp ' + parseFloat(value).toLocaleString('id-ID');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Data Management</h1>
          <p className="text-gray-600">Kelola data transaksi summary monthly</p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cabang</label>
              <select
                name="cabang"
                value={filters.cabang}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Cabang</option>
                {cabangList.map((c) => (
                  <option key={c} value={c}>{c}</option>
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
                {unitList.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#0B66B2] text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              + Tambah Data Baru
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#0B66B2]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Periode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cabang</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">NOA</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">OS</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">OS PAR</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">OS NPL</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">OS LAR</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B66B2]"></div>
                      <p className="mt-2">Memuat data...</p>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  transactions.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.Periode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.cabang}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.NamaUnit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{row.NOA || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(row.OS)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(row.OSPar)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(row.OSNPL)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(row.OS_LAR)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleDelete(row)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && transactions.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchTransactions(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Halaman {pagination.page} dari {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchTransactions(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#0B66B2] text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-bold">Tambah Data Baru</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Periode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="periode"
                    value={formData.periode}
                    onChange={handleFormChange}
                    placeholder="31/12/2024 00:00:00"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cabang <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="cabang"
                    value={formData.cabang}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Cabang</option>
                    {cabangList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="namaUnit"
                    value={formData.namaUnit}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Unit</option>
                    {unitList.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NOA</label>
                  <input
                    type="number"
                    name="noa"
                    value={formData.noa}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OS</label>
                  <input
                    type="number"
                    name="os"
                    value={formData.os}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OS PAR</label>
                  <input
                    type="number"
                    name="osPar"
                    value={formData.osPar}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OS NPL</label>
                  <input
                    type="number"
                    name="osNpl"
                    value={formData.osNpl}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OS LAR</label>
                  <input
                    type="number"
                    name="osLar"
                    value={formData.osLar}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0B66B2] text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Section */}
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Audit Logs</h2>
        <p className="text-gray-500 mb-3">Lihat riwayat aktivitas</p>
        <p className="text-gray-400 text-sm">Coming soon</p>
      </div>
    </div>
  );
};

export default DataManagement;
