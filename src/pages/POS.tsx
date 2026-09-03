import { useState, useEffect, useRef } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle2, Barcode } from "lucide-react";
import { useToast } from "../components/Toast";
import { addCheckoutToOutbox } from "../utils/offlineQueue";

export default function POS() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [customers, setCustomers] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
  const [customerId, setCustomerId] = useState<string>("");

  const fetchProducts = () => {
    const token = localStorage.getItem("warung_token");
    fetch("/api/products", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  };

  const fetchCustomers = () => {
    const token = localStorage.getItem("warung_token");
    fetch("/api/customers", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => setCustomers([]));
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      showToast("Stok habis!", "error");
      return;
    }

    const sellingPrice = Number(product.selling_price) || 0;
    const maxStock = Number(product.stock) || 0;

    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.qty >= maxStock) {
          showToast("Stok tidak mencukupi!", "warning");
          return prev;
        }
        const newQty = existing.qty + 1;
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, qty: newQty, subtotal: newQty * Number(item.price) }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: sellingPrice,
          qty: 1,
          subtotal: sellingPrice,
          maxStock: maxStock,
        },
      ];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return item;
          if (newQty > item.maxStock) {
            showToast("Stok tidak mencukupi!", "warning");
            return item;
          }
          return { ...item, qty: newQty, subtotal: newQty * Number(item.price) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + Number(item.subtotal), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "credit" && !customerId) {
      showToast("Pilih pelanggan untuk transaksi kredit!", "error");
      return;
    }
    setIsSubmitting(true);
    setCheckoutError(null);

    const idempotency_key = crypto.randomUUID();
    const payload: any = {
      idempotency_key,
      items: cart.map(item => ({ product_id: item.product_id, qty: item.qty })),
      total_amount: totalAmount,
      payment_method: paymentMethod,
    };
    if (paymentMethod === "credit") payload.customer_id = customerId;

    try {
      const token = localStorage.getItem("warung_token");
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSuccess(true);
        setCart([]);
        setRetryCount(0);
        setPaymentMethod("cash");
        setCustomerId("");
        fetchProducts();
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        const data = await res.json();
        const errMsg = data.error?.format ? "Error validasi data" : (data.error || "Gagal menyimpan transaksi");
        setCheckoutError(errMsg);
        setRetryCount(prev => prev + 1);
        showToast(errMsg, "error");
      }
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
        // Network error - save to offline queue
        await addCheckoutToOutbox(payload);
        const errMsg = "Koneksi terputus. Transaksi disimpan offline (pending).";
        setCheckoutError(errMsg);
        showToast(errMsg, "info");
        setIsSuccess(true);
        setCart([]);
        setTimeout(() => {
          setIsSuccess(false);
          setCheckoutError(null);
        }, 5000);
      } else {
        const errMsg = "Terjadi kesalahan jaringan";
        setCheckoutError(errMsg);
        setRetryCount(prev => prev + 1);
        showToast(errMsg, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanBarcode = async () => {
    const code = scanCode.trim();
    if (!code) return;
    setScanning(true);
    const token = localStorage.getItem("warung_token");
    try {
      const res = await fetch(`/api/products/barcode/${encodeURIComponent(code)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 404) {
          showToast("Produk dengan barcode ini tidak ditemukan", "error");
        } else {
          showToast("Gagal mencari barcode", "error");
        }
        setScanCode("");
        return;
      }
      const product = await res.json();
      addToCart(product);
      setScanCode("");
      if (scanInputRef.current) scanInputRef.current.focus();
    } catch (err) {
      showToast("Gagal menghubungi server", "error");
    } finally {
      setScanning(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Transaksi Berhasil!</h2>
          <p className="text-gray-400">Data penjualan telah disimpan.</p>
        </div>
        <button
          onClick={() => setIsSuccess(false)}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          Catat Transaksi Baru
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* Kiri: Daftar Produk */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={scanInputRef}
              type="text"
              placeholder="Scan barcode lalu Enter..."
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleScanBarcode();
                }
              }}
              disabled={scanning}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 mb-2"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Memuat produk...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`text-left p-3.5 rounded-xl border transition-all ${product.stock <= 0
                    ? "opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed"
                    : "bg-white border-gray-200 hover:border-emerald-400 hover:shadow-md active:scale-[0.97]"
                    }`}
                >
                  <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 text-sm">{product.name}</h3>
                  <p className="text-emerald-600 font-extrabold text-base">
                    Rp {Number(product.selling_price).toLocaleString("id-ID")}
                  </p>
                  <p className={`text-xs font-medium mt-1 ${product.stock <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                    Stok: {product.stock} {product.unit}
                  </p>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  Produk tidak ditemukan
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Kanan: Keranjang */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[50vh] lg:h-auto">
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <h2 className="font-bold text-lg">Keranjang</h2>
          {cart.length > 0 && (
            <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
              {cart.length} item
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-2">
              <ShoppingCart className="w-14 h-14 opacity-20" />
              <p className="text-sm">Tap produk untuk menambahkan</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-900 text-sm leading-tight">{item.name}</h4>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-red-400 hover:text-red-600 p-1 -mr-1 -mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 bg-white rounded-lg p-0.5 border border-gray-200">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      disabled={item.qty <= 1}
                      className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold w-5 text-center text-sm">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-emerald-600 font-extrabold text-sm">
                    Rp {Number(item.subtotal).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => { setPaymentMethod("cash"); setCustomerId(""); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${paymentMethod === "cash"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"
                }`}
            >
              Tunai
            </button>
            <button
              onClick={() => setPaymentMethod("credit")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${paymentMethod === "credit"
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-gray-500 border-gray-200 hover:border-amber-300"
                }`}
            >
              Kredit (Utang)
            </button>
          </div>

          {paymentMethod === "credit" && (
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-sm"
            >
              <option value="">— Pilih pelanggan —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.balance > 0 ? ` (utang Rp ${Number(c.balance).toLocaleString("id-ID")})` : ""}
                </option>
              ))}
            </select>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium text-sm">Total Tagihan</span>
            <span className="text-2xl font-extrabold text-emerald-600">
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>

          {checkoutError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
              <p className="text-red-600 text-xs font-semibold">Gagal menyimpan:</p>
              <p className="text-red-700 text-sm">{checkoutError}</p>
              {retryCount > 0 && (
                <p className="text-red-400 text-xs">Percobaan ke-{retryCount}. Keranjang masih tersimpan, tekan tombol di bawah untuk mencoba lagi.</p>
              )}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className={`w-full py-4 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
              checkoutError
                ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            }`}
          >
            {isSubmitting ? (
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : checkoutError ? (
              "Coba Lagi"
            ) : (
              "Simpan Transaksi"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
