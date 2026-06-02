"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  saveSession,
  type AuthUser,
} from "@/lib/auth";
import { loginUser, registerUser } from "@/lib/auth-api";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser(stored);
    } else if (token) {
      clearSession();
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await loginUser({ email, password });
      saveSession(session);
      setUser(session.user);
      router.push("/");
      router.refresh();
    },
    [router]
  );

  const register = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const session = await registerUser({
        email,
        password,
        full_name: fullName || undefined,
      });
      saveSession(session);
      setUser(session.user);
      router.push("/");
      router.refresh();
    },
    [router]
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
