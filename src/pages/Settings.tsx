import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { useToast } from "../components/Toast";

interface SettingsData {
    low_stock_threshold: string;
    min_margin_percent: string;
    [key: string]: string;
}

const DEFAULTS: SettingsData = {
    low_stock_threshold: "5",
    min_margin_percent: "10"
};

export default function Settings() {
    const { showToast } = useToast();
    const [settings, setSettings] = useState<SettingsData>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("warung_token");
        fetch("/api/settings", {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then((res) => res.json())
            .then((data) => {
                setSettings({ ...DEFAULTS, ...data });
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem("warung_token");

        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (!res.ok) throw new Error("Gagal menyimpan pengaturan");
            showToast("Pengaturan berhasil disimpan!", "success");
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Memuat pengaturan...</div>;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <header className="flex items-center gap-3">
                <div className="p-3 bg-gray-100 rounded-xl text-gray-700">
                    <SettingsIcon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
                    <p className="text-gray-500 text-sm">Konfigurasi preferensi aplikasi Anda</p>
                </div>
            </header>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Stok Management */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">📦 Manajemen Stok</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Batas Peringatan Stok Hampir Habis
                        </label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="number"
                                min="0"
                                required
                                value={settings.low_stock_threshold}
                                onChange={(e) => handleChange("low_stock_threshold", e.target.value)}
                                className="w-full max-w-[150px] p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-bold"
                            />
                            <span className="text-sm text-gray-500">
                                Produk muncul di Dashboard jika stok {"<="} {settings.low_stock_threshold}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Margin */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">💰 Keuntungan</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Persentase Margin / Keuntungan Minimal per Produk
                        </label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                required
                                value={settings.min_margin_percent}
                                onChange={(e) => handleChange("min_margin_percent", e.target.value)}
                                className="w-full max-w-[150px] p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-bold"
                            />
                            <span className="text-sm text-gray-500">
                                % — Peringatan jika margin jual {"<"} {settings.min_margin_percent}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </form>
        </div>
    );
}
