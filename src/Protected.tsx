import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export function ProtectedRoute({ children }: any) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/" />;
    return children;
}
