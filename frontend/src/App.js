// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Select from "react-select";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Icon from "./components/Icon";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import DataManagement from "./pages/DataManagement";
import HomePage from "./HomePage";
import Productivity from "./Productivity";
import TrenPortofolio from "./TrenPortofolio";
import Portofolio from "./Portofolio";
import TrenQuality from "./TrenQuality";
import Quality from "./Quality";
import Product from "./Product";
import WriteOff from "./WriteOff";
import { dataAPI, notificationAPI } from "./services/api";
import axios from 'axios';

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

const MainLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, logout } = useAuth();

  const [cabangList, setCabangList] = useState([]);
  const [unitList, setUnitList] = useState([]);

  const [selectedCabang, setSelectedCabang] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch filters with authentication
    dataAPI.getFilters()
      .then((res) => {
        if (res.data) {
          const uniqueCabang = [...new Set(res.data.cabang)];
          const uniqueUnit = [...new Set(res.data.unit)];
          setCabangList(uniqueCabang);
          setUnitList(uniqueUnit);
        }
      })
      .catch((err) => {
        console.error("Error fetching filter data:", err);
      });
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationAPI.getNotifications({ limit: 10 });
        if (res.data.success) {
          setNotifications(res.data.data.notifications);
          setUnreadCount(res.data.data.unread_count);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: "Home", path: "/", icon: "home" },
    { name: "Productivity", path: "/productivity", icon: "chart" },
    { name: "Tren Portofolio", path: "/tren-portofolio", icon: "trending-up" },
    { name: "Portofolio", path: "/portofolio", icon: "briefcase" },
    { name: "Tren Quality", path: "/tren-quality", icon: "presentation" },
    { name: "Quality", path: "/quality", icon: "badge-check" },
    { name: "Product", path: "/product", icon: "cube" },
    { name: "Write Off", path: "/write-off", icon: "document" },
  ];

  const adminNavItems = [
    { name: "Admin Dashboard", path: "/admin", icon: "template" },
    { name: "User Management", path: "/admin/users", icon: "users" },
    { name: "Data Management", path: "/admin/data", icon: "database" },
  ];

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.log("Logout API error:", error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.location.href = '/login';
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await notificationAPI.markAsRead(notifId);
      setNotifications(notifications.map(n => 
        n.id === notifId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return notifTime.toLocaleDateString('id-ID');
  };

  return (
    <div className="font-sans bg-gray-100 min-h-screen flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col fixed h-full z-30`}>
        {/* Logo & Toggle */}
        <div className="bg-[#ffffff] text-white p-5 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src="/logo-login.png" alt="PNM Logo" className="h-30" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#0B66B2] hover:bg-gray-100 p-2 rounded transition"
          >
            {sidebarOpen ? <Icon name="chevron-left" className="w-5 h-5" /> : <Icon name="chevron-right" className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 mt-4">
          {/* Admin Section */}
          {user?.role === 'admin' && (
            <div className="mb-4">
              {sidebarOpen && (
                <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase">
                  Admin
                </div>
              )}
              {adminNavItems.map((item, idx) => (
                <Link
                  key={`admin-${idx}`}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 transition-all ${
                    currentPath === item.path
                      ? "bg-purple-100 text-purple-700 border-r-4 border-purple-600"
                      : "text-gray-700 hover:bg-purple-50"
                  }`}
                  title={!sidebarOpen ? item.name : ''}
                >
                  <Icon name={item.icon} />
                  {sidebarOpen && <span className="font-medium">{item.name}</span>}
                </Link>
              ))}
            </div>
          )}

          {/* Dashboard Section */}
          <div>
            {sidebarOpen && (
              <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase">
                Dashboard
              </div>
            )}
            {navItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 transition-all ${
                  currentPath === item.path
                    ? "bg-[#e5f1fb] text-[#0B66B2] border-r-4 border-[#0B66B2]"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                title={!sidebarOpen ? item.name : ''}
              >
                <Icon name={item.icon} />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <Icon name="logout" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
        {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] p-10 text-center transform transition-all scale-100">

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-100">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-8 h-8 text-red-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V4" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Konfirmasi Logout
            </h2>

            {/* Description */}
            <p className="text-gray-500 text-base mb-8">
              Apakah Anda yakin ingin keluar dari dashboard?
            </p>

            {/* Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition duration-200"
              >
                Batal
              </button>

              <button
                onClick={handleLogout}
                className="px-6 py-2 rounded-lg bg-[#0B66B2] text-white shadow-md hover:shadow-lg hover:opacity-95 transition duration-200"
              >
                Ya, Logout
              </button>
            </div>

          </div>
        </div>
      )}
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Header - Fixed Position */}
        <header className="bg-[#0B66B2] text-white px-6 py-4 shadow-md fixed top-0 right-0 left-0 z-20" style={{ marginLeft: sidebarOpen ? '256px' : '80px', transition: 'margin-left 0.3s' }}>
          <div className="flex items-center justify-between">
            {/* Left: Date Picker */}
            <div className="flex items-center gap-2">
              <Icon name="calendar" className="w-5 h-5" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white/20 text-white px-3 py-2 rounded border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Center: Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-xl font-semibold">
              Monitoring Bisnis ULaMM
            </div>

            {/* Right: Action Icons & Profile */}
            <div className="flex items-center gap-4">
              {/* Notification Icon */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative hover:bg-white/20 p-2 rounded-full transition"
                  title="Notifikasi"
                >
                  <Icon name="bell" className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-gray-800 font-semibold text-sm">Notifikasi</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-[#0B66B2] hover:underline"
                        >
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                          Tidak ada notifikasi
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                              !notif.is_read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-gray-800 text-sm font-medium">{notif.title}</p>
                                <p className="text-gray-600 text-xs mt-1">{notif.message}</p>
                                <p className="text-gray-400 text-xs mt-1">
                                  {formatNotificationTime(notif.created_at)}
                                </p>
                              </div>
                              {!notif.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 text-center border-t border-gray-200">
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="text-[#0B66B2] text-sm font-medium hover:underline"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="flex items-center gap-3 pl-3 border-l border-white/30">
                <div className="text-right">
                  <div className="font-medium text-sm">{user?.username}</div>
                  <div className="text-xs opacity-80 uppercase">{user?.level}</div>
                </div>
                <div className="w-10 h-10 bg-white text-[#0B66B2] rounded-full flex items-center justify-center font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Add spacing for fixed header */}
        <div className="h-[72px]"></div>

        {/* Filter Dropdowns */}
        <div className="bg-white px-6 py-4 shadow-sm">
          {/* Access Level Indicator */}
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-[#0B66B2] rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Akses Data:</span>
              {user?.level === 'pusat' && (
                <div className="flex items-center gap-2">
                  <Icon name="globe" className="w-4 h-4 text-[#0B66B2]" />
                  <span className="text-sm text-[#0B66B2] font-semibold">
                    Seluruh Data (Pusat) - {cabangList.length} Cabang, {unitList.length} Unit
                  </span>
                </div>
              )}
              {user?.level === 'cabang' && (
                <div className="flex items-center gap-2">
                  <Icon name="office-building" className="w-4 h-4 text-[#0B66B2]" />
                  <span className="text-sm text-[#0B66B2] font-semibold">
                    Cabang {user?.cabang_id || 'Anda'} - {unitList.length} Unit
                  </span>
                </div>
              )}
              {user?.level === 'unit' && (
                <div className="flex items-center gap-2">
                  <Icon name="library" className="w-4 h-4 text-[#0B66B2]" />
                  <span className="text-sm text-[#0B66B2] font-semibold">
                    Unit {user?.unit_id || 'Anda'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            {/* CABANG */}
            <div className="flex flex-col">
              <label htmlFor="cabang" className="text-sm font-medium text-gray-700 mb-1">
                Cabang PNM
              </label>
              <div className="w-[280px]">
                <Select
                  id="cabang"
                  name="cabang"
                  options={cabangList.map((nama) => ({ value: nama, label: nama }))}
                  value={selectedCabang ? { value: selectedCabang, label: selectedCabang } : null}
                  onChange={(e) => {
                    setSelectedCabang(e ? e.value : "");
                    setSelectedUnit(""); // reset unit saat cabang berubah
                  }}
                  isClearable
                  placeholder="Pilih Cabang"
                  noOptionsMessage={() => "Tidak ditemukan"}
                  styles={{
                    menu: (provided) => ({ ...provided, zIndex: 9999 }),
                  }}
                />
              </div>
            </div>

            {/* UNIT */}
            <div className="flex flex-col">
              <label htmlFor="unit" className="text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <div className="w-[280px]">
                <Select
                  id="unit"
                  name="unit"
                  options={unitList.map((nama) => ({ value: nama, label: nama }))}
                  value={selectedUnit ? { value: selectedUnit, label: selectedUnit } : null}
                  onChange={(e) => {
                    setSelectedUnit(e ? e.value : "");
                    setSelectedCabang(""); // reset cabang saat unit berubah
                  }}
                  isClearable
                  placeholder="Pilih Unit"
                  noOptionsMessage={() => "Tidak ditemukan"}
                  styles={{
                    menu: (provided) => ({ ...provided, zIndex: 9999 }),
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Routes */}
        <div className="p-6">
          <Routes>
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/data" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DataManagement />
                </ProtectedRoute>
              } 
            />
            
            {/* Regular Routes */}
            <Route
              path="/"
              element={<HomePage selectedCabang={selectedCabang} selectedUnit={selectedUnit} selectedDate={selectedDate} />}
            />
            <Route 
              path="/productivity" 
              element={<Productivity selectedCabang={selectedCabang} selectedUnit={selectedUnit} selectedDate={selectedDate} />} 
            />
            <Route 
              path="/tren-portofolio" 
              element={<TrenPortofolio selectedCabang={selectedCabang} selectedUnit={selectedUnit} selectedDate={selectedDate} />} 
            />
            <Route 
              path="/portofolio" 
              element={<Portofolio selectedCabang={selectedCabang} selectedUnit={selectedUnit} selectedDate={selectedDate} />} 
            />
            <Route 
              path="/tren-quality" 
              element={<TrenQuality selectedCabang={selectedCabang} selectedUnit={selectedUnit} selectedDate={selectedDate} />} 
            />
            <Route 
              path="/quality" 
              element={<Quality selectedCabang={selectedCabang} selectedUnit={selectedUnit} selectedDate={selectedDate} />} 
            />
            <Route 
              path="/product" 
              element={<Product selectedCabang={selectedCabang} selectedUnit={selectedUnit} selectedDate={selectedDate} />} 
            />
            <Route 
              path="/write-off" 
              element={<WriteOff selectedCabang={selectedCabang} selectedUnit={selectedUnit} selectedDate={selectedDate} />} 
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;