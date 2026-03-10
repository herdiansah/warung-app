import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function StockHistoryTab() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("warung_token");
        fetch("/api/stocks/history", {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setLogs(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="py-8 text-center text-gray-500">Memuat riwayat stok...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                            <th className="p-4 font-bold text-gray-700">Waktu</th>
                            <th className="p-4 font-bold text-gray-700">Produk</th>
                            <th className="p-4 font-bold text-gray-700">Keterangan</th>
                            <th className="p-4 font-bold text-gray-700">Jumlah</th>
                            <th className="p-4 font-bold text-gray-700">Sisa Stok</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log: any) => (
                            <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                    {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: id })}
                                </td>
                                <td className="p-4 font-medium text-gray-900">{log.product?.name || "Produk Terhapus"}</td>
                                <td className="p-4 text-sm text-gray-600">
                                    {log.change_type === "sale" && <span className="text-red-500 font-medium">Terjual (POS)</span>}
                                    {log.change_type === "manual" && <span className="text-amber-500 font-medium">Update Opname (+ / -)</span>}
                                    {log.change_type === "delete_sale_restore" && <span className="text-emerald-600 font-medium">Restorasi Stok (Retur)</span>}
                                    {log.change_type === "update_product" && <span className="text-blue-500 font-medium">Edit Produk Manual</span>}
                                    {log.change_type === "initial_stock" && <span className="text-emerald-500 font-medium">Stok Awal Produk Baru</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`font-bold ${(log.change_type === 'sale' || (log.change_type === 'update_product' && log.stock_before > log.stock_after) || (log.change_type === 'manual' && log.stock_before > log.stock_after)) ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {(log.change_type === 'sale' || (log.change_type === 'update_product' && log.stock_before > log.stock_after) || (log.change_type === 'manual' && log.stock_before > log.stock_after)) ? "-" : "+"}
                                        {log.qty}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {log.stock_before} ➔ <span className="font-bold text-gray-900">{log.stock_after}</span>
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    Belum ada catatan perubahan stok.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
