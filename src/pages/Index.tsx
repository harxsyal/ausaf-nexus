import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, roleHomePath } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    navigate(session ? roleHomePath(role) : "/auth", { replace: true });
  }, [session, role, loading, navigate]);
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest animate-pulse">
        Initializing ABN Digital…
      </div>
    </div>
  );
};
export default Index;
