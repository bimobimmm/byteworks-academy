import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="section py-20">Checking admin access...</div>;
  if (!user) return <Navigate to="/locked" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}
