import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, ShoppingCart } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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

            // Store token and redirect
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 border-4 border-gray-100">
            <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg m-4 border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-indigo-600 p-4 rounded-full mb-4 shadow-md text-white">
                        <ShoppingCart size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Login Warung App</h1>
                    <p className="text-gray-500 mt-2 text-sm">Masuk untuk mencatat transaksi jualan</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-sm">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm text-gray-800"
                            placeholder="admin@warung.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm text-gray-800"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md flex justify-center items-center h-14"
                    >
                        {loading ? (
                            <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
                        ) : (
                            <>
                                <LogIn className="mr-2" size={20} /> Masuk Sekarang
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>Email: admin@warung.com | Pass: 123456</p>
                </div>
            </div>
        </div>
    );
}
