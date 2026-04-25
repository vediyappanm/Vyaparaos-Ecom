import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Crown } from "lucide-react";

const FullScreen = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(265_60%_14%)] via-[hsl(280_55%_16%)] to-[hsl(265_70%_10%)]">
    <div className="text-center text-white">
      <div className="w-14 h-14 mx-auto rounded-2xl gradient-accent flex items-center justify-center shadow-glow mb-4 animate-pulse">
        <Crown className="w-7 h-7 text-accent-foreground" />
      </div>
      {children}
    </div>
  </div>
);

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { session, loading: aLoad } = useAuth();
  const { tenant, loading: tLoad } = useTenant();
  const location = useLocation();

  if (aLoad || (session && tLoad)) {
    return <FullScreen><p className="text-white/70 text-sm">Loading…</p></FullScreen>;
  }
  if (!session) return <Navigate to="/auth" replace state={{ from: location }} />;
  if (!tenant && location.pathname !== "/onboarding") return <Navigate to="/onboarding" replace />;
  return children;
};
