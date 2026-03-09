import { useState, useEffect } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle2 } from "lucide-react";

export default function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      alert("Stok habis!");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert("Stok tidak mencukupi!");
          return prev;
        }
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.selling_price,
          qty: 1,
          subtotal: product.selling_price,
          maxStock: product.stock,
        },
      ];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return item; // Use remove instead
          if (newQty > item.maxStock) {
            alert("Stok tidak mencukupi!");
            return item;
          }
          return { ...item, qty: newQty, subtotal: newQty * item.price };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          total: totalAmount,
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setCart([]);
        // Refresh products to get updated stock
        fetch("/api/products")
          .then((res) => res.json())
          .then(setProducts);
        
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan transaksi");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Transaksi Berhasil!</h2>
          <p className="text-gray-500">Data penjualan telah disimpan.</p>
        </div>
        <button
          onClick={() => setIsSuccess(false)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-sm transition-colors"
        >
          Catat Transaksi Baru
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* Kiri: Daftar Produk */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
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

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat produk...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    product.stock <= 0
                      ? "opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed"
                      : "bg-white border-gray-200 hover:border-emerald-500 hover:shadow-md active:scale-95"
                  }`}
                >
                  <h3 className="font-bold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
                  <p className="text-emerald-600 font-bold mb-2">
                    Rp {product.selling_price.toLocaleString("id-ID")}
                  </p>
                  <p className={`text-xs font-medium ${product.stock <= 5 ? 'text-red-500' : 'text-gray-500'}`}>
                    Stok: {product.stock}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kanan: Keranjang */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[50vh] lg:h-auto">
        <div className="p-4 bg-emerald-600 text-white flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <h2 className="font-bold text-lg">Keranjang ({cart.length})</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p>Belum ada produk dipilih</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="flex flex-col gap-2 pb-4 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-900">{item.name}</h4>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-emerald-600 font-medium">Rp {item.price.toLocaleString("id-ID")}</p>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      disabled={item.qty <= 1}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold w-6 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 font-medium">Total Tagihan</span>
            <span className="text-2xl font-bold text-emerald-600">
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </div>
      </div>
    </div>
  );
}
