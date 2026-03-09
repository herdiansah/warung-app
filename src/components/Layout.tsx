import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Home, Package, ShoppingCart, History, BarChart3, LogOut } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/pos", label: "Kasir", icon: ShoppingCart },
    { path: "/products", label: "Produk", icon: Package },
    { path: "/history", label: "Riwayat", icon: History },
    { path: "/reports", label: "Laporan", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:flex">
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 md:hidden z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-xl ${isActive ? "text-emerald-600" : "text-gray-500"
                }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen p-4">
        <div className="mb-8 px-4">
          <h1 className="text-2xl font-bold text-emerald-600">WarungApp</h1>
        </div>
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                    ? "bg-emerald-50 text-emerald-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full relative">
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={() => {
              localStorage.removeItem("warung_token");
              localStorage.removeItem("warung_user");
              window.location.href = "/login";
            }}
            className="flex items-center text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} className="mr-1" /> Keluar
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
