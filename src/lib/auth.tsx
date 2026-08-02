import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch, tokens, USER_STORAGE_KEY } from "./api";
import type { AuthTokenResponse, UserMe } from "./types";

type AuthContextValue = {
  user: UserMe | null;
  ready: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(USER_STORAGE_KEY);
    if (cached) {
      try {
        setUser(JSON.parse(cached) as UserMe);
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    if (!tokens.access) {
      setReady(true);
      return;
    }
    apiFetch<UserMe>("/auth/me/")
      .then((me) => {
        setUser(me);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me));
      })
      .catch(() => {
        tokens.clear();
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<AuthTokenResponse>("/auth/login/", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    tokens.set(data.access, data.refresh);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    tokens.clear();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (roles: string[]) => {
      if (roles.length === 0) return true;
      const mine = (user?.roles ?? []).map((r) => r.toLowerCase());
      return roles.some((r) => mine.includes(r.toLowerCase()));
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, isAuthenticated: !!user, login, logout, hasRole }),
    [user, ready, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
