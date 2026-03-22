import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, X, Minus, Package, History, AlertTriangle } from "lucide-react";
import { StockHistoryTab } from "../components/StockHistoryTab";
import { useToast } from "../components/Toast";

export default function Products() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    purchase_price: "",
    selling_price: "",
    stock: "",
    unit: "pcs",
  });
  const [activeTab, setActiveTab] = useState<"products" | "stocks">("products");
  const [minMarginPercent, setMinMarginPercent] = useState<number>(10);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  const adjustStock = async (id: number, diff: number) => {
    const token = localStorage.getItem("warung_token");
    try {
      const res = await fetch("/api/stocks/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: id, diff, reason: "manual" })
      });
      if (res.ok) {
        fetchProducts(); // Refresh products
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal update stok", "error");
      }
    } catch (e: any) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  const fetchProducts = () => {
    const token = localStorage.getItem("warung_token");
    fetch("/api/products", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data produk");
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
    // Fetch settings for margin validation
    const token = localStorage.getItem("warung_token");
    fetch("/api/settings", { headers: { "Authorization": `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.min_margin_percent) setMinMarginPercent(parseFloat(data.min_margin_percent));
        if (data.low_stock_threshold) setLowStockThreshold(parseInt(data.low_stock_threshold, 10));
      })
      .catch(() => { });
  }, []);

  // Compute margin
  const purchasePrice = parseFloat(formData.purchase_price) || 0;
  const sellingPrice = parseFloat(formData.selling_price) || 0;
  const marginPercent = purchasePrice > 0 ? ((sellingPrice - purchasePrice) / purchasePrice) * 100 : 0;
  const profitPerUnit = sellingPrice - purchasePrice;
  const isMarginLow = purchasePrice > 0 && sellingPrice > 0 && marginPercent < minMarginPercent;

  const handleOpenModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category || "",
        purchase_price: product.purchase_price.toString(),
        selling_price: product.selling_price.toString(),
        stock: product.stock.toString(),
        unit: product.unit,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        category: "",
        purchase_price: "",
        selling_price: "",
        stock: "",
        unit: "pcs",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
    const method = editingProduct ? "PUT" : "POST";

    const payload = {
      ...formData,
      purchase_price: parseFloat(formData.purchase_price),
      selling_price: parseFloat(formData.selling_price),
      stock: parseInt(formData.stock, 10),
    };

    const token = localStorage.getItem("warung_token");
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyimpan produk");
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const token = localStorage.getItem("warung_token");
    const res = await fetch(`/api/products/${deleteTarget.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    setIsDeleting(false);
    setDeleteTarget(null);
    if (res.ok) {
      showToast("Produk berhasil dihapus.", "success");
      fetchProducts();
    } else {
      const data = await res.json();
      showToast(data.error || "Gagal menghapus produk", "error");
    }
  };

  // Quick win #9: 3-tier stock color coding
  const stockColorClass = (stock: number) => {
    if (stock <= lowStockThreshold) return "bg-red-100 text-red-700";
    if (stock <= lowStockThreshold * 2) return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {activeTab === "products" ? "Daftar Produk" : "Riwayat Stok"}
        </h1>
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto mt-4 sm:mt-0 shadow-inner">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center justify-center gap-2 flex-1 sm:px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'products' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Package className="w-4 h-4" /> Stok
          </button>
          <button
            onClick={() => setActiveTab("stocks")}
            className={`flex items-center justify-center gap-2 flex-1 sm:px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'stocks' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <History className="w-4 h-4" /> Riwayat
          </button>
        </div>

        {activeTab === "products" && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            Tambah Produk
          </button>
        )}
      </header>

      {activeTab === "stocks" ? (
        <StockHistoryTab />
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat data...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                      <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                        <button
                          onClick={() => adjustStock(product.id, -1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-red-500 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${stockColorClass(product.stock)}`}>
                          {product.stock} {product.unit}
                        </span>
                        <button
                          onClick={() => adjustStock(product.id, 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-emerald-500 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{product.category || "Tanpa Kategori"}</p>

                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Harga Beli:</span>
                        <span className="font-medium text-gray-700">Rp {product.purchase_price.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Harga Jual:</span>
                        <span className="font-bold text-emerald-600 text-base">Rp {product.selling_price.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
              {/* Quick win #4: Better empty state */}
              {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-500">
                    {search ? `Tidak ada produk untuk "${search}"` : "Belum ada produk"}
                  </p>
                  {!search && (
                    <p className="text-sm text-gray-400 mt-1">Klik "Tambah Produk" untuk mulai.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hapus Produk?</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  <span className="font-semibold text-gray-700">{deleteTarget.name}</span> akan dihapus dari daftar produk.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Contoh: Indomie Goreng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori (Opsional)</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Contoh: Makanan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Margin Indicator */}
              {purchasePrice > 0 && sellingPrice > 0 && (
                <div className={`p-3 rounded-xl border text-sm ${isMarginLow
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {isMarginLow && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    <span className="font-bold">
                      Margin: {marginPercent.toFixed(1)}%
                      {isMarginLow && ` — Di bawah batas minimal ${minMarginPercent}%`}
                    </span>
                  </div>
                  <p className="text-xs">
                    Keuntungan per unit: Rp {profitPerUnit.toLocaleString("id-ID")}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Satuan *</label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  >
                    <option value="pcs">Pcs</option>
                    <option value="bungkus">Bungkus</option>
                    <option value="botol">Botol</option>
                    <option value="renteng">Renteng</option>
                    <option value="kg">Kg</option>
                    <option value="liter">Liter</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
