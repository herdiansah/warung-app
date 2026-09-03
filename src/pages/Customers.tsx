import React, { useState, useEffect } from "react";
import { UserPlus, Save, X, Loader2, BookOpen, Wallet, Trash2 } from "lucide-react";
import { useToast } from "../components/Toast";

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });

  const [ledgerTarget, setLedgerTarget] = useState<any>(null);
  const [ledger, setLedger] = useState<any>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", note: "" });
  const [isPaying, setIsPaying] = useState(false);

  const token = () => localStorage.getItem("warung_token");

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers", { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) setCustomers(await res.json());
    } catch {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setFormData({ name: "", phone: "", address: "" });
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditTarget(c);
    setFormData({ name: c.name, phone: c.phone || "", address: c.address || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(editTarget ? `/api/customers/${editTarget.id}` : "/api/customers", {
        method: editTarget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(editTarget ? "Pelanggan diperbarui" : "Pelanggan ditambahkan", "success");
        setShowModal(false);
        fetchCustomers();
      } else {
        showToast(data.error || "Gagal menyimpan pelanggan", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    }
  };

  const handleDelete = async (c: any) => {
    if (!confirm(`Hapus pelanggan "${c.name}"?`)) return;
    try {
      const res = await fetch(`/api/customers/${c.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Pelanggan dihapus", "success");
        fetchCustomers();
      } else {
        showToast(data.error || "Gagal menghapus", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    }
  };

  const openLedger = async (c: any) => {
    setLedgerTarget(c);
    setLedger(null);
    setPayForm({ amount: "", note: "" });
    setLedgerLoading(true);
    try {
      const res = await fetch(`/api/customers/${c.id}/ledger`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) setLedger(await res.json());
    } catch {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setLedgerLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerTarget) return;
    setIsPaying(true);
    try {
      const res = await fetch(`/api/customers/${ledgerTarget.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ amount: Number(payForm.amount), note: payForm.note || null }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Pembayaran dicatat", "success");
        const refreshed = await fetch(`/api/customers/${ledgerTarget.id}/ledger`, { headers: { Authorization: `Bearer ${token()}` } });
        setLedger(await refreshed.json());
        setPayForm({ amount: "", note: "" });
        fetchCustomers();
      } else {
        showToast(data.error || "Gagal mencatat pembayaran", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setIsPaying(false);
    }
  };

  const currentUser = JSON.parse(localStorage.getItem("warung_user") || "{}");
  const canEdit = currentUser.role === "owner" || currentUser.role === "manager";
  const totalDebt = customers.reduce((s, c) => s + Math.max(0, Number(c.balance || 0)), 0);

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Pelanggan & Utang</h2>
          <p className="text-sm text-gray-500 mt-1">
            Total piutang: <span className="font-bold text-amber-600">Rp {totalDebt.toLocaleString("id-ID")}</span>
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-emerald-200"
          >
            <UserPlus size={18} />
            Tambah Pelanggan
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-4">Nama</th>
                <th className="p-4">Telepon</th>
                <th className="p-4 text-right">Total Utang</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    {c.address && <div className="text-xs text-gray-400">{c.address}</div>}
                  </td>
                  <td className="p-4 text-sm text-gray-500">{c.phone || "-"}</td>
                  <td className="p-4 text-right">
                    <span className={`font-bold text-sm ${Number(c.balance) > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      Rp {Number(c.balance || 0).toLocaleString("id-ID")}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openLedger(c)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors"
                      >
                        <BookOpen size={14} /> Buku
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => openEdit(c)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition-colors"
                          >
                            <Save size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">Belum ada pelanggan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-gray-900">{editTarget ? "Edit Pelanggan" : "Tambah Pelanggan"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border-gray-200 border px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-xl border-gray-200 border px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full rounded-xl border-gray-200 border px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <Save size={18} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ledger */}
      {ledgerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="font-semibold text-lg text-gray-900">Buku — {ledgerTarget.name}</h3>
              <button onClick={() => setLedgerTarget(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {ledgerLoading ? (
              <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" /></div>
            ) : ledger ? (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 font-medium">Total Kredit</p>
                    <p className="text-lg font-extrabold text-gray-900">Rp {Number(ledger.total_credit).toLocaleString("id-ID")}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 font-medium">Total Bayar</p>
                    <p className="text-lg font-extrabold text-emerald-600">Rp {Number(ledger.total_paid).toLocaleString("id-ID")}</p>
                  </div>
                  <div className={`rounded-xl p-4 ${Number(ledger.balance) > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
                    <p className="text-xs text-gray-500 font-medium">Sisa Utang</p>
                    <p className={`text-lg font-extrabold ${Number(ledger.balance) > 0 ? "text-red-600" : "text-emerald-600"}`}>Rp {Number(ledger.balance).toLocaleString("id-ID")}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Riwayat Transaksi Kredit</h4>
                  <div className="space-y-2">
                    {ledger.transactions.map((t: any) => (
                      <div key={t.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2.5 text-sm">
                        <div>
                          <span className={t.status === "void" ? "line-through text-gray-400" : "text-gray-800 font-medium"}>
                            {new Date(t.transaction_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          {t.status === "void" && <span className="ml-2 text-xs text-red-400">(dibatalkan)</span>}
                          <span className="ml-2 text-xs text-gray-400">oleh {t.user?.name || "-"}</span>
                        </div>
                        <span className="font-bold text-gray-900">Rp {Number(t.total_amount).toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                    {ledger.transactions.length === 0 && <p className="text-sm text-gray-400">Belum ada transaksi kredit.</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Riwayat Pembayaran</h4>
                  <div className="space-y-2">
                    {ledger.payments.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center bg-emerald-50/50 rounded-lg px-4 py-2.5 text-sm">
                        <div>
                          <span className="text-gray-800">
                            {new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          {p.note && <span className="ml-2 text-xs text-gray-400">{p.note}</span>}
                        </div>
                        <span className="font-bold text-emerald-600">-Rp {Number(p.amount).toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                    {ledger.payments.length === 0 && <p className="text-sm text-gray-400">Belum ada pembayaran.</p>}
                  </div>
                </div>

                {Number(ledger.balance) > 0 && (
                  <form onSubmit={handlePayment} className="border-t border-gray-100 pt-4 space-y-3">
                    <h4 className="text-sm font-bold text-gray-700">Catat Pembayaran</h4>
                    <div className="flex gap-3">
                      <input
                        required
                        type="number"
                        min="1"
                        max={Number(ledger.balance)}
                        placeholder={`Max Rp ${Number(ledger.balance).toLocaleString("id-ID")}`}
                        value={payForm.amount}
                        onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                        className="flex-1 rounded-xl border-gray-200 border px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Catatan (opsional)"
                        value={payForm.note}
                        onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                        className="flex-1 rounded-xl border-gray-200 border px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isPaying}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Wallet size={16} /> Bayar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">Gagal memuat buku pelanggan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
