import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="section py-20">Loading secure workspace...</div>;
  if (!user) return <Navigate to="/locked" replace />;
  return children;
}
