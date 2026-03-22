import { Link, useLocation, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { Home, Package, ShoppingCart, History, BarChart3, LogOut, Settings as SettingsIcon, AlertTriangle } from "lucide-react";

export function Layout() {
  const location = useLocation();
  const userStr = localStorage.getItem("warung_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const [storeName, setStoreName] = useState(localStorage.getItem("warung_store_name") || "WarungApp");
  const [lowStockCount, setLowStockCount] = useState(0);

  // Quick win #3 & #6: Fetch store name and low stock count
  useEffect(() => {
    const token = localStorage.getItem("warung_token");
    if (!token) return;

    fetch("/api/stocks/low", { headers: { "Authorization": `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setLowStockCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});

    fetch("/api/settings", { headers: { "Authorization": `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : {})
      .then(data => {
        if (data.store_name) {
          setStoreName(data.store_name);
          localStorage.setItem("warung_store_name", data.store_name);
        }
      })
      .catch(() => {});
  }, []);

  // Re-read store_name from localStorage on location change (after Settings save)
  useEffect(() => {
    const saved = localStorage.getItem("warung_store_name");
    if (saved) setStoreName(saved);
  }, [location.pathname]);

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/pos", label: "Kasir", icon: ShoppingCart },
    { path: "/products", label: "Produk", icon: Package, badge: lowStockCount > 0 ? lowStockCount : null },
    { path: "/history", label: "Riwayat", icon: History },
    { path: "/reports", label: "Laporan", icon: BarChart3 },
    { path: "/settings", label: "Pengaturan", icon: SettingsIcon },
  ];

  const handleLogout = () => {
    localStorage.removeItem("warung_token");
    localStorage.removeItem("warung_user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:flex">
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white/95 backdrop-blur-lg border-t border-gray-200 flex justify-around p-1.5 md:hidden z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] print:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center p-1.5 rounded-xl transition-all ${isActive
                  ? "text-emerald-600"
                  : "text-gray-400 active:text-gray-600"
                }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className={`text-[9px] font-semibold ${isActive ? "text-emerald-600" : ""}`}>
                {item.label}
              </span>
              {/* Quick win #3: Low stock badge */}
              {item.badge && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 min-h-screen shadow-sm print:hidden">
        {/* Brand */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">{storeName}</h1>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Point of Sale</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                )}
                {/* Quick win #3: Low stock badge on sidebar */}
                {item.badge && !isActive && (
                  <span className="ml-auto flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || "User"}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email || ""}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
