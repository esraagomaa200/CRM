import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../lib/api";

const TOKEN_KEY = "crm_auth_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On load (or when the token changes), verify the session against the
  // backend rather than trusting a cached user object.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await authApi.me(token);
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) {
          setToken(null);
          localStorage.removeItem(TOKEN_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function login(email, password) {
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Invalid email or password." };
    }
  }

  async function signup(name, email, password) {
    try {
      const data = await authApi.register({ name, email, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Could not create your account." };
    }
  }

  function logout() {
    if (token) authApi.logout(token).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
