// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Select from "react-select";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Icon from "./components/Icon";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import HomePage from "./HomePage";
import Productivity from "./Productivity";
import TrenPortofolio from "./TrenPortofolio";
import Portofolio from "./Portofolio";
import TrenQuality from "./TrenQuality";
import Quality from "./Quality";
import Product from "./Product";
import WriteOff from "./WriteOff";
import { dataAPI } from "./services/api";

const App = () => {
  return (
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="font-sans bg-gray-100 min-h-screen flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col fixed h-full z-30`}>
        {/* Logo & Toggle */}
        <div className="bg-[#0B66B2] text-white p-4 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src="/logoputih.png" alt="PNM Logo" className="h-8" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-white/20 p-2 rounded transition"
          >
            {sidebarOpen ? <Icon name="chevron-left" className="w-5 h-5" /> : <Icon name="chevron-right" className="w-5 h-5" />}
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0B66B2] rounded-full flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">{user?.username}</div>
                <div className="text-xs text-gray-500 uppercase">{user?.level}</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
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
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <Icon name="logout" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Header */}
        <header className="bg-[#0B66B2] text-white px-6 py-4 shadow-md">
          <div className="text-xl font-semibold">
            Monitoring Bisnis ULaMM
          </div>
        </header>

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
            
            {/* Regular Routes */}
            <Route
              path="/"
              element={<HomePage selectedCabang={selectedCabang} selectedUnit={selectedUnit} />}
            />
            <Route 
              path="/productivity" 
              element={<Productivity selectedCabang={selectedCabang} selectedUnit={selectedUnit} />} 
            />
            <Route 
              path="/tren-portofolio" 
              element={<TrenPortofolio selectedCabang={selectedCabang} selectedUnit={selectedUnit} />} 
            />
            <Route 
              path="/portofolio" 
              element={<Portofolio selectedCabang={selectedCabang} selectedUnit={selectedUnit} />} 
            />
            <Route 
              path="/tren-quality" 
              element={<TrenQuality selectedCabang={selectedCabang} selectedUnit={selectedUnit} />} 
            />
            <Route 
              path="/quality" 
              element={<Quality selectedCabang={selectedCabang} selectedUnit={selectedUnit} />} 
            />
            <Route 
              path="/product" 
              element={<Product selectedCabang={selectedCabang} selectedUnit={selectedUnit} />} 
            />
            <Route 
              path="/write-off" 
              element={<WriteOff selectedCabang={selectedCabang} selectedUnit={selectedUnit} />} 
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;