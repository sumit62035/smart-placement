import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { loginAdmin, logoutAdmin, getMe } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem("admin");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  // true while the initial session check is running
  const [sessionChecked, setSessionChecked] = useState(false);

  // On mount: if a token exists, validate it with /auth/me.
  // If the server rejects it (expired/revoked) the 401 interceptor
  // in api/index.js will clear storage and redirect automatically.
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setSessionChecked(true);
      return;
    }
    getMe()
      .then((res) => {
        // Refresh the stored admin profile in case it changed
        localStorage.setItem("admin", JSON.stringify(res.data.admin));
        setAdmin(res.data.admin);
      })
      .catch(() => {
        // 401 handler in axios interceptor already cleared storage
        setAdmin(null);
      })
      .finally(() => setSessionChecked(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (username, password) => {
    const res = await loginAdmin({ username, password });
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("admin", JSON.stringify(res.data.admin));
    setAdmin(res.data.admin);
  }, []);

  const logout = useCallback(async () => {
    try { await logoutAdmin(); } catch {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("admin");
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ admin, login, logout, isAuthenticated: !!admin, sessionChecked }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
