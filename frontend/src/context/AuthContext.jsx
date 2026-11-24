/**
 * AuthContext: provides authentication state and actions to the entire app.
 *
 * Stores the JWT token in memory (not localStorage) and persists a minimal
 * "is logged in" flag to sessionStorage so the user survives a page refresh
 * within the same browser tab.
 *
 * The actual user profile is fetched from /api/auth/me on mount so we always
 * have fresh data from the server.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first render, check if we have a session in memory / sessionStorage
  useEffect(() => {
    const storedToken = sessionStorage.getItem("dm_token");
    if (storedToken) {
      setToken(storedToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      api
        .get("/api/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => {
          // Token expired or invalid — clear session
          sessionStorage.removeItem("dm_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { access_token } = res.data;
    setToken(access_token);
    sessionStorage.setItem("dm_token", access_token);
    api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    const me = await api.get("/api/auth/me");
    setUser(me.data);
    return me.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (_) {
      /* ignore */
    }
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("dm_token");
    delete api.defaults.headers.common["Authorization"];
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Custom hook — use this in any component to access auth state. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
