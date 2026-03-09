import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Trash2, ChevronDown, ChevronUp, Receipt } from "lucide-react";

export default function History() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [expandedTx, setExpandedTx] = useState<number | null>(null);
  const [txDetails, setTxDetails] = useState<Record<number, any>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});

  const fetchTransactions = () => {
    setLoading(true);
    fetch(`/api/transactions?date=${dateFilter}`)
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransactions();
  }, [dateFilter]);

  const toggleExpand = async (id: number) => {
    if (expandedTx === id) {
      setExpandedTx(null);
      return;
    }
    
    setExpandedTx(id);
    
    if (!txDetails[id]) {
      setLoadingDetails((prev) => ({ ...prev, [id]: true }));
      try {
        const res = await fetch(`/api/transactions/${id}`);
        const data = await res.json();
        setTxDetails((prev) => ({ ...prev, [id]: data.items }));
      } catch (err) {
        console.error("Failed to fetch details");
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [id]: false }));
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Yakin ingin menghapus transaksi ini? Stok barang akan dikembalikan.")) {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTransactions();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus transaksi");
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
        
        <div className="relative w-full sm:w-auto">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm font-medium text-gray-700"
          />
        </div>
      </header>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat data...</div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center flex flex-col items-center justify-center">
          <Receipt className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Transaksi</h3>
          <p className="text-gray-500">Tidak ada penjualan pada tanggal ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
              <div 
                className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(tx.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      Rp {tx.total.toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      {format(new Date(tx.date), "HH:mm - d MMMM yyyy", { locale: id })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(tx.id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Transaksi"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="p-2 text-gray-400">
                    {expandedTx === tx.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {expandedTx === tx.id && (
                <div className="bg-gray-50 p-4 sm:p-6 border-t border-gray-100">
                  <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Detail Pembelian</h4>
                  {loadingDetails[tx.id] ? (
                    <p className="text-sm text-gray-500">Memuat detail...</p>
                  ) : (
                    <div className="space-y-3">
                      {txDetails[tx.id]?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                              {item.qty}
                            </span>
                            <span className="font-medium text-gray-900">{item.product_name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">Rp {item.subtotal.toLocaleString("id-ID")}</p>
                            <p className="text-xs text-gray-500">@ Rp {item.price.toLocaleString("id-ID")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
