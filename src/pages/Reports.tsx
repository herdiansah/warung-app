import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { BarChart3, TrendingUp, DollarSign, PackageOpen, Calendar } from "lucide-react";

export default function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("warung_token");
    fetch(`/api/reports?month=${monthFilter}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil laporan");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [monthFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>

        <div className="relative w-full sm:w-auto">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm font-medium text-gray-700"
          />
        </div>
      </header>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat laporan...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Omzet</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {data.total_revenue.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Keuntungan Kotor</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {data.total_profit.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                <PackageOpen className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Transaksi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.total_transactions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Produk Terlaris Bulan Ini
            </h2>

            {data.top_products.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-xl">
                Belum ada data penjualan di bulan ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                      <th className="pb-3 font-medium">No</th>
                      <th className="pb-3 font-medium">Nama Produk</th>
                      <th className="pb-3 font-medium text-right">Terjual</th>
                      <th className="pb-3 font-medium text-right">Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.top_products.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 text-gray-500 font-medium">{i + 1}</td>
                        <td className="py-4 font-bold text-gray-900">{p.name}</td>
                        <td className="py-4 text-right">
                          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                            {p.total_qty}
                          </span>
                        </td>
                        <td className="py-4 text-right font-bold text-emerald-600">
                          Rp {p.total_revenue.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
