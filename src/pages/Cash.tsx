import React, { useState, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2, Loader2, Landmark } from "lucide-react";
import { useToast } from "../components/Toast";

const CATEGORY_LABELS: Record<string, string> = {
  modal: "Modal Usaha",
  pribadi: "Ambil Pribadi",
  sewa: "Sewa Tempat",
  listrik: "Listrik / Air",
  kulakan_lain: "Kulakan Lain",
  lain: "Lainnya",
};

export default function Cash() {
  const [movements, setMovements] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "out", category: "listrik", amount: "", note: "" });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const token = () => localStorage.getItem("warung_token");
  const currentUser = JSON.parse(localStorage.getItem("warung_user") || "{}");
  const canEdit = currentUser.role === "owner" || currentUser.role === "manager";

  const fetchData = async () => {
    try {
      const [movRes, sumRes] = await Promise.all([
        fetch("/api/cash", { headers: { Authorization: `Bearer ${token()}` } }),
        fetch("/api/cash/summary", { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      if (movRes.ok) setMovements(await movRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
    } catch {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Mutasi kas dicatat", "success");
        setShowForm(false);
        setForm({ type: "out", category: "listrik", amount: "", note: "" });
        fetchData();
      } else {
        showToast(data.error || "Gagal mencatat", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan mutasi ini?")) return;
    try {
      const res = await fetch(`/api/cash/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        showToast("Mutasi dihapus", "success");
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal menghapus", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Buku Kas</h2>
          <p className="text-sm text-gray-500 mt-1">Kas riil = penjualan tunai + bayar utang + kas masuk − kas keluar</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-emerald-200"
          >
            <Plus size={18} /> Catat Mutasi
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-4 text-white col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-medium mb-1"><Landmark size={14} /> Saldo Kas</div>
            <p className="text-xl font-extrabold">Rp {Number(summary.balance).toLocaleString("id-ID")}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1"><Wallet size={14} /> Penjualan Tunai</div>
            <p className="text-lg font-bold text-gray-900">Rp {Number(summary.sales_cash).toLocaleString("id-ID")}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1"><TrendingUp size={14} /> Bayar Utang Masuk</div>
            <p className="text-lg font-bold text-emerald-600">Rp {Number(summary.payments_in).toLocaleString("id-ID")}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1"><TrendingUp size={14} /> Kas Masuk</div>
            <p className="text-lg font-bold text-emerald-600">Rp {Number(summary.cash_in).toLocaleString("id-ID")}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1"><TrendingDown size={14} /> Kas Keluar</div>
            <p className="text-lg font-bold text-red-600">Rp {Number(summary.cash_out).toLocaleString("id-ID")}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Catatan</th>
                <th className="p-4 text-right">Jumlah</th>
                {canEdit && <th className="p-4"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(m.moved_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${m.type === "in" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {CATEGORY_LABELS[m.category] || m.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{m.note || "-"}<span className="text-xs text-gray-300 ml-2">({m.user?.name})</span></td>
                  <td className={`p-4 text-right font-bold text-sm ${m.type === "in" ? "text-emerald-600" : "text-red-600"}`}>
                    {m.type === "in" ? "+" : "-"} Rp {Number(m.amount).toLocaleString("id-ID")}
                  </td>
                  {canEdit && (
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(m.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="p-8 text-center text-gray-500">Belum ada mutasi kas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-gray-900">Catat Mutasi Kas</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "in" })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${form.type === "in" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-500 border-gray-200"}`}
                >
                  Kas Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "out" })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${form.type === "out" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-500 border-gray-200"}`}
                >
                  Kas Keluar
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border-gray-200 border px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah *</label>
                <input required type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-xl border-gray-200 border px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="50000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full rounded-xl border-gray-200 border px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="Bayar listrik bulan ini" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <Wallet size={18} /> {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
