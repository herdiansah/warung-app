import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ClipboardCheck, Save, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "../components/Toast";

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

export default function DailyClosing() {
  const { showToast } = useToast();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [data, setData] = useState<any>(null);
  const [actualCash, setActualCash] = useState<string>("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const token = localStorage.getItem("warung_token");

  const fetchClosing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/closings/${date}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (d.closing) {
          setActualCash(String(d.closing.actual_cash));
          setNote(d.closing.note || "");
        } else {
          setActualCash("");
          setNote("");
        }
      } else {
        showToast("Gagal mengambil data", "error");
      }
    } catch {
      showToast("Koneksi error", "error");
    } finally {
      setLoading(false);
    }
  }, [date]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/closings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setHistory(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchClosing(); }, [fetchClosing]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const difference = data && actualCash !== "" ? Number(actualCash) - data.expected : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualCash === "" || Number(actualCash) < 0) {
      showToast("Isi uang fisik di laci", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/closings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ date, actual_cash: Number(actualCash), note: note || null }),
      });
      const d = await res.json();
      if (res.ok) {
        showToast("Tutup kasir tersimpan", "success");
        fetchClosing();
        fetchHistory();
      } else {
        showToast(d.error || "Gagal menyimpan", "error");
      }
    } catch {
      showToast("Koneksi error", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-emerald-600" /> Tutup Kasir
        </h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm font-medium text-gray-700"
        />
      </header>

      {loading || !data ? (
        <div className="text-center py-12 text-gray-500">Memuat data...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reconciliation panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {format(new Date(`${date}T00:00:00`), "EEEE, d MMMM yyyy", { locale: localeId })}
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Penjualan tunai</span>
                <span className="font-semibold">{fmt(data.sales_cash)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Pembayaran utang pelanggan</span>
                <span className="font-semibold text-emerald-600">+ {fmt(data.payments_in)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Kas masuk manual</span>
                <span className="font-semibold text-emerald-600">+ {fmt(data.cash_in)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Kas keluar manual</span>
                <span className="font-semibold text-red-600">- {fmt(data.cash_out)}</span>
              </div>
              <div className="flex justify-between py-3 bg-emerald-50 rounded-xl px-4 mt-2">
                <span className="font-bold text-emerald-800">Harusnya di laci</span>
                <span className="font-bold text-emerald-800 text-lg">{fmt(data.expected)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uang fisik di laci</label>
                <input
                  type="number"
                  min="0"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Misal: selisih karena kembalian"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {difference !== null && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold ${
                  difference === 0 ? "bg-emerald-50 text-emerald-700" :
                  difference > 0 ? "bg-blue-50 text-blue-700" :
                  "bg-red-50 text-red-700"
                }`}>
                  {difference === 0 ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  {difference === 0 ? "Cocok, tidak ada selisih" :
                    difference > 0 ? `Selisih lebih ${fmt(difference)}` : `Selisih kurang ${fmt(Math.abs(difference))}`}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || actualCash === ""}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {data.closing ? "Update Tutup Kasir" : "Simpan Tutup Kasir"}
              </button>
              {data.closing && (
                <p className="text-xs text-gray-400 text-center">
                  Terakhir ditutup oleh {data.closing.user?.name} 
                </p>
              )}
            </form>
          </div>

          {/* History panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Riwayat 30 Hari Terakhir</h2>
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-xl">
                Belum ada tutup kasir tersimpan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider text-xs">
                      <th className="pb-3 font-medium">Tanggal</th>
                      <th className="pb-3 font-medium text-right">Harusnya</th>
                      <th className="pb-3 font-medium text-right">Fisik</th>
                      <th className="pb-3 font-medium text-right">Selisih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="py-3 font-medium">{format(new Date(`${c.date}T00:00:00`), "d MMM yyyy", { locale: localeId })}</td>
                        <td className="py-3 text-right text-gray-500">{fmt(Number(c.expected_cash))}</td>
                        <td className="py-3 text-right font-semibold">{fmt(Number(c.actual_cash))}</td>
                        <td className={`py-3 text-right font-bold ${
                          Number(c.difference) === 0 ? "text-emerald-600" :
                          Number(c.difference) > 0 ? "text-blue-600" : "text-red-600"
                        }`}>
                          {Number(c.difference) === 0 ? "0" : fmt(Number(c.difference))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
