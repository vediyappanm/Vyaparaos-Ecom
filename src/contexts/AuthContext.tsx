import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSession, clearSession, type User as AuthUser } from "@/lib/auth";

type AuthCtx = {
  session: { user: AuthUser; token: string } | null;
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthCtx['session']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session on mount
    getSession().then((currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });
  }, []);

  const signOut = async () => {
    clearSession();
    setSession(null);
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
