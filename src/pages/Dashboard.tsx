import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ShoppingBag, AlertCircle, Plus, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboard = () => {
    setLoading(true);
    setError(false);
    const token = localStorage.getItem("warung_token");
    fetch("/api/dashboard", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl h-28" />
          <div className="bg-white p-6 rounded-2xl h-28" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl h-64" />
          <div className="bg-white rounded-2xl h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500">Gagal memuat data dashboard.</p>
        <button onClick={fetchDashboard} className="flex items-center gap-2 text-emerald-600 font-medium hover:underline">
          <RefreshCw className="w-4 h-4" /> Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Ringkasan Hari Ini</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link
          to="/pos"
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Catat Penjualan</span>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-xl shadow-md">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Penjualan</p>
            <p className="text-3xl font-extrabold text-gray-900">
              Rp {(data.today_total ?? 0).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl shadow-md">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Transaksi</p>
            <p className="text-3xl font-extrabold text-gray-900">{data.today_count ?? 0} <span className="text-base font-medium text-gray-400">Transaksi</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🏆 Produk Terlaris Hari Ini</h2>
          {!data.top_products || data.top_products.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada penjualan hari ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.top_products.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-100 text-amber-600' :
                        i === 1 ? 'bg-gray-200 text-gray-600' :
                          i === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-100 text-gray-500'
                      }`}>
                      {i + 1}
                    </div>
                    <span className="font-semibold text-gray-900">{p.name}</span>
                  </div>
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full text-sm">
                    {p.total_qty} terjual
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">Stok Hampir Habis</h2>
          </div>
          {!data.low_stock || data.low_stock.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-sm font-medium">Semua stok aman</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.low_stock.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <div>
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category || "Tanpa Kategori"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-600 font-extrabold text-lg">{p.stock}</p>
                    <p className="text-xs text-gray-400">{p.unit}</p>
                  </div>
                </div>
              ))}
              <Link to="/products" className="block text-center text-sm text-emerald-600 font-semibold hover:underline pt-2">
                Kelola Stok →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
