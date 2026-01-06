// src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import Icon from '../components/Icon';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    pusatUsers: 0,
    cabangUsers: 0,
    unitUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAllUsers();
      
      if (response.data.success) {
        const users = response.data.data;
        
        setStats({
          totalUsers: users.length,
          activeUsers: users.filter(u => u.is_active === 1).length,
          adminUsers: users.filter(u => u.role === 'admin').length,
          regularUsers: users.filter(u => u.role === 'user').length,
          pusatUsers: users.filter(u => u.level === 'pusat').length,
          cabangUsers: users.filter(u => u.level === 'cabang').length,
          unitUsers: users.filter(u => u.level === 'unit').length
        });
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('Gagal memuat statistik user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Memuat data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Selamat datang, {user?.username}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon="users"
          color="bg-blue-500"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon="badge-check"
          color="bg-green-500"
        />
        <StatCard
          title="Admin Users"
          value={stats.adminUsers}
          icon="template"
          color="bg-purple-500"
        />
        <StatCard
          title="Regular Users"
          value={stats.regularUsers}
          icon="home"
          color="bg-gray-500"
        />
      </div>

      {/* Level Distribution */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Distribusi Level Akses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LevelCard
            level="Pusat"
            count={stats.pusatUsers}
            description="Akses ke semua data"
            color="bg-red-100 text-red-700"
          />
          <LevelCard
            level="Cabang"
            count={stats.cabangUsers}
            description="Akses data cabang"
            color="bg-yellow-100 text-yellow-700"
          />
          <LevelCard
            level="Unit"
            count={stats.unitUsers}
            description="Akses data unit"
            color="bg-green-100 text-green-700"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionButton
            to="/admin/users"
            icon="users"
            title="Manage Users"
            description="Tambah, edit, atau hapus user"
          />
          <ActionButton
            to="/"
            icon="chart"
            title="View Dashboard"
            description="Lihat dashboard monitoring"
          />
          <ActionButton
            to="/admin/logs"
            icon="document"
            title="Audit Logs"
            description="Lihat riwayat aktivitas"
            disabled
          />
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`${color} w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center`}>
        <Icon name={icon} className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    </div>
  </div>
);

// Level Card Component
const LevelCard = ({ level, count, description, color }) => (
  <div className={`${color} rounded-lg p-4`}>
    <div className="text-xl sm:text-2xl font-bold mb-1">{count}</div>
    <div className="text-sm sm:text-base font-semibold mb-1">{level}</div>
    <div className="text-xs sm:text-sm opacity-75">{description}</div>
  </div>
);

// Action Button Component
const ActionButton = ({ to, icon, title, description, disabled }) => {
  const content = (
    <div className={`border-2 border-gray-200 rounded-lg p-4 transition-all ${
      disabled 
        ? 'opacity-50 cursor-not-allowed bg-gray-50' 
        : 'hover:border-[#0B66B2] hover:shadow-md cursor-pointer'
    }`}>
      <div className="mb-3">
        <Icon name={icon} className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700" />
      </div>
      <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1">{title}</div>
      <div className="text-xs sm:text-sm text-gray-600">{description}</div>
      {disabled && <div className="text-xs text-gray-500 mt-2">Coming soon</div>}
    </div>
  );

  if (disabled) {
    return content;
  }

  return <Link to={to}>{content}</Link>;
};

export default AdminDashboard;
