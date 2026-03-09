import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ShoppingBag, AlertCircle, Plus } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ringkasan Hari Ini</h1>
          <p className="text-gray-500 text-sm">
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
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Catat Penjualan</span>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Penjualan</p>
            <p className="text-3xl font-bold text-gray-900">
              Rp {data.today_total.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Transaksi</p>
            <p className="text-3xl font-bold text-gray-900">{data.today_count} Transaksi</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Produk Terlaris Hari Ini</h2>
          {data.top_products.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Belum ada penjualan hari ini</p>
          ) : (
            <div className="space-y-4">
              {data.top_products.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                      {i + 1}
                    </div>
                    <span className="font-medium text-gray-900">{p.name}</span>
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
          {data.low_stock.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Semua stok aman</p>
          ) : (
            <div className="space-y-4">
              {data.low_stock.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.category || "Tanpa Kategori"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-600 font-bold text-lg">{p.stock}</p>
                    <p className="text-xs text-gray-500">{p.unit}</p>
                  </div>
                </div>
              ))}
              <Link to="/products" className="block text-center text-sm text-emerald-600 font-medium hover:underline pt-2">
                Kelola Stok →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
