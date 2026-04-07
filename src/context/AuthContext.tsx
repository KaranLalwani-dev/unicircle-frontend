import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@/types";
import { authApi, userApi } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const performLogout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      performLogout();
    };
    window.addEventListener("auth-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth-unauthorized", handleUnauthorized);
  }, [performLogout]);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const fetchedUser = await userApi.getMe();
          setUser(fetchedUser);
        } catch (e) {
          // If 401, the event listener handles cleanup
          console.error("Failed to fetch user on mount", e);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (data: any) => {
    const res = await authApi.login(data);
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const signup = async (data: any) => {
    const res = await authApi.signup(data);
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout: performLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
