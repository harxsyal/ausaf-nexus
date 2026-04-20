import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, AppRole, roleHomePath } from "@/context/AuthContext";

interface Props {
  children: ReactNode;
  allow?: AppRole[]; // if omitted, any authenticated user
}

export const ProtectedRoute = ({ children, allow }: Props) => {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest animate-pulse">
          Authenticating…
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  if (allow && role && !allow.includes(role) && role !== "super_admin") {
    return <Navigate to={roleHomePath(role)} replace />;
  }
  return <>{children}</>;
};
