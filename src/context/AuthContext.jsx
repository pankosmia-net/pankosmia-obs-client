import { createContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext({
  user: null,
  loading: true,
  isOnline: false,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    fetch("/me")
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          if (data && data.github_user_id) {
            setIsOnline(true);
            setUser(data);
            return;
          }
        }
        if (r.status === 401) {
          setIsOnline(true);
          return;
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isOnline) {
      fetch("/net/enable", { method: "POST" }).catch(() => {});
      document.body.classList.add("hosted-online");
    }
  }, [isOnline]);

  const signIn = useCallback(() => {
    window.location.href = `/auth/start?redirect=${encodeURIComponent(location.pathname)}`;
  }, []);

  const signOut = useCallback(() => {
    fetch("/auth/logout", { method: "POST" }).then(() => setUser(null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isOnline, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
