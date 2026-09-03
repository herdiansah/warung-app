import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import POS from "./pages/POS";
import History from "./pages/History";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings"; // Added import for Settings
import Users from "./pages/Users";
import Customers from "./pages/Customers";
import Cash from "./pages/Cash";
import DailyClosing from "./pages/DailyClosing";
import Login from "./pages/Login";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("warung_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/history" element={<History />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/cash" element={<Cash />} />
        <Route path="/closings" element={<DailyClosing />} />
        <Route path="/settings" element={<Settings />} /> {/* Added route for Settings */}
      </Route>
    </Routes>
  );
}
