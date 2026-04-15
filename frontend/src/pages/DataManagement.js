// frontend/src/pages/DataManagement.js
import React, { useState, useEffect, useCallback } from 'react';
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
    noaPar: '',
    noaNpl: '',
    noaLar: '',
    os: '',
    osPar: '',
    osNpl: '',
    osLar: ''
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
  const fetchTransactions = useCallback(async (page = 1) => {
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
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  // validasi semua field
  for (const key in formData) {
    if (!formData[key] || formData[key].toString().trim() === '') {
      setErrorMessage('Semua field wajib diisi!');
      setShowErrorModal(true);
      return;
    }
  }

  // VALIDASI FORMAT PERIODE
  // VALIDASI FORMAT PERIODE (FIX)
  const regex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}(:\d{2})?$/;

  const periode = formData.periode.trim();

  if (!regex.test(periode)) {
    setErrorMessage('Format periode harus DD/MM/YYYY HH:mm atau HH:mm:ss');
    setShowErrorModal(true);
    return;
  }

  // 🔥 VALIDASI TIDAK BOLEH NEGATIF
  const numericFields = [
    'noa', 'noaPar', 'noaNpl', 'noaLar',
    'os', 'osPar', 'osNpl', 'osLar'
  ];

  for (const field of numericFields) {
    if (parseFloat(formData[field]) < 0) {
      setErrorMessage(`Field ${field.toUpperCase()} tidak boleh bernilai negatif!`);
      setShowErrorModal(true);
      return;
    }
  }

  setShowConfirmAddModal(true);
};

  const confirmAddData = async () => {
    try {
      await dataManagementAPI.createTransaction(formData);

      setShowConfirmAddModal(false);
      setShowModal(false);

      setSuccessMessage('Data berhasil ditambahkan!');
      setShowSuccessModal(true);

      setFormData({
        periode: '',
        cabang: '',
        namaUnit: '',
        noa: '',
        noaPar: '',
        noaNpl: '',
        noaLar: '',
        os: '',
        osPar: '',
        osNpl: '',
        osLar: ''
      });

      fetchTransactions();
    } catch (error) {
      setShowConfirmAddModal(false);
      setErrorMessage(error.response?.data?.message || 'Gagal menambah data');
      setShowErrorModal(true);
    }
  };

  const handleDelete = (row) => {
    setSelectedRow(row);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const periode = selectedRow.Periode || '';
      const cabang = selectedRow.Cabang || '';
      const namaUnit =
        selectedRow.NamaUnit ||
        selectedRow.namaunit ||
        selectedRow.Nama_Unit ||
        '';

      const id = `${periode}|${cabang}|${namaUnit}`;

      await dataManagementAPI.deleteTransaction(encodeURIComponent(id));

      setShowDeleteModal(false);
      setSuccessMessage('Data berhasil dihapus!');
      setShowSuccessModal(true);

      fetchTransactions();
    } catch (error) {
      setShowDeleteModal(false);
      setErrorMessage(error.response?.data?.message || 'Gagal menghapus data');
      setShowErrorModal(true);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 999999, // Ambil semua data sesuai filter
        ...filters
      };
      
      const res = await dataManagementAPI.getTransactions(params);
      
      if (res.data.success && res.data.data.length > 0) {
        const dataToExport = res.data.data;
        
        // Define headers
        const headers = [
          'Periode',
          'Cabang',
          'Nama Unit',
          'NOA',
          'NOA PAR',
          'NOA NPL',
          'NOA LAR',
          'OS',
          'OS PAR',
          'OS NPL',
          'OS LAR'
        ];
        
        // Create CSV content (using standard format handle commas nicely)
        let csv = headers.join(',') + '\n';
        
        dataToExport.forEach(row => {
          const values = [
            `"${row.Periode || ''}"`,
            `"${row.Cabang || ''}"`,
            `"${row.NamaUnit || ''}"`,
            row.NOA || 0,
            row.NoaPar || 0,
            row.NoaNpl || 0,
            row.Noa_LAR || 0,
            row.OS || 0,
            row.OSPar || 0,
            row.OSNPL || 0,
            row.OS_LAR || 0
          ];
          csv += values.join(',') + '\n';
        });
        
        // Trigger download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `data_management_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Tidak ada data untuk didownload sesuai filter ini.');
      }
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('Gagal mendownload data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'Rp 0';
    return 'Rp ' + parseFloat(value).toLocaleString('id-ID');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Data Management</h1>
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

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#0B66B2] text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              + Tambah Data Baru
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 border border-[#0B66B2] text-[#0B66B2] rounded-md hover:bg-blue-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0B66B2]"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              <span>Download Data</span>
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">NOA PAR</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">NOA NPL</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">NOA LAR</th>
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
                    <td colSpan="12" className="px-6 py-8 text-center text-gray-500">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  transactions.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.Periode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.Cabang}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.NamaUnit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{row.NOA || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{row.NoaPar || 0} </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900"> {row.NoaNpl || 0} </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900"> {row.Noa_LAR || 0} </td>
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
                    placeholder="DD/MM/YYYY HH:mm"
                    required
                    pattern="^([0-2]\d|3[01])\/(0\d|1[0-2])\/\d{4} \d{2}:\d{2}$"
                    title="Format harus DD/MM/YYYY HH:mm"
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
                    min="0"
                    value={formData.noa}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NOA PAR
                  </label>
                  <input
                    type="number"
                    name="noaPar"
                    min="0"
                    value={formData.noaPar}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NOA NPL
                  </label>
                  <input
                    type="number"
                    name="noaNpl"
                    min="0"
                    value={formData.noaNpl}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NOA LAR
                  </label>
                  <input
                    type="number"
                    name="noaLar"
                    min="0"
                    value={formData.noaLar}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OS</label>
                  <input
                    type="number"
                    name="os"
                    min="0"
                    value={formData.os}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OS PAR</label>
                  <input
                    type="number"
                    name="osPar"
                    min="0"
                    value={formData.osPar}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OS NPL</label>
                  <input
                    type="number"
                    name="osNpl"
                    min="0"
                    value={formData.osNpl}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OS LAR</label>
                  <input
                    type="number"
                    name="osLar"
                    min="0"
                    value={formData.osLar}
                    onChange={handleFormChange}
                    required
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

      {showConfirmAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl p-8 w-[400px] text-center shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Konfirmasi Data
            </h2>
            <p className="text-gray-500 text-base mb-8">
              Apakah Anda yakin ingin menambahkan data ini?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirmAddModal(false)}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={confirmAddData}
                className="px-6 py-2 rounded-lg bg-[#0B66B2] text-white shadow-md hover:opacity-95"
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl p-8 w-[400px] text-center shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Konfirmasi Hapus
            </h2>
            <p className="text-gray-500 text-base mb-8">
              Apakah Anda yakin ingin menghapus data ini?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 rounded-lg bg-red-500 text-white shadow-md hover:opacity-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl p-8 w-[400px] text-center shadow-xl">
            <h2 className="text-2xl font-bold text-green-600 mb-3">
              Berhasil!
            </h2>
            <p className="text-gray-500 text-base mb-8">
              {successMessage}
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="px-6 py-2 rounded-lg bg-[#0B66B2] text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl p-8 w-[400px] text-center shadow-xl">
            <h2 className="text-2xl font-bold text-red-500 mb-3">
              Gagal!
            </h2>
            <p className="text-gray-500 text-base mb-8">
              {errorMessage}
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-6 py-2 rounded-lg bg-[#0B66B2] text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;
