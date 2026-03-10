import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, ShoppingCart, Eye, EyeOff } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login gagal");
            }

            localStorage.setItem("warung_token", data.token);
            localStorage.setItem("warung_user", JSON.stringify(data.user));
            navigate("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
            <div className="max-w-md w-full m-4 animate-fade-in">
                {/* Brand Card */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <div className="flex flex-col items-center mb-8">
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 rounded-2xl mb-4 shadow-lg text-white">
                            <ShoppingCart size={36} />
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">WarungApp</h1>
                        <p className="text-gray-400 mt-1 text-sm">Masuk untuk mencatat penjualan</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 p-4 mb-6 rounded-xl animate-slide-up">
                            <p className="text-red-600 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm text-gray-800 bg-gray-50/50"
                                placeholder="admin@warung.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm text-gray-800 bg-gray-50/50"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-4 px-4 rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex justify-center items-center h-14 active:scale-[0.98]"
                        >
                            {loading ? (
                                <span className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></span>
                            ) : (
                                <>
                                    <LogIn className="mr-2" size={20} /> Masuk Sekarang
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400">Demo: admin@warung.com / 123456</p>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    WarungApp v1.0 — Pencatatan Penjualan Warung
                </p>
            </div>
        </div>
    );
}
