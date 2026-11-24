import { useEffect, useState, type ReactNode } from "react";
import {
  getMeRequest,
  loginRequest,
  registerRequest,
  type LoginData,
  type RegisterData,
} from "../api/auth";
import {
  clearToken,
  getToken,
  saveToken,
  SESSION_EXPIRED_EVENT,
} from "../api/client";
import type { AuthResponse, User } from "../types/user";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(getToken() !== null);

  // Écouter l'expiration d'une session pendant l'utilisation.
  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
      setLoading(false);
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  // Restaurer la session à l'ouverture de l'application.
  useEffect(() => {
    const token = getToken();

    if (!token) return;

    getMeRequest()
      .then((user) => {
        // Ne pas restaurer une ancienne session invalidée.
        if (getToken() === token) {
          setUser(user);
        }
      })
      .catch(() => {
        if (getToken() === token) {
          clearToken();
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function startSession({ token, user }: AuthResponse) {
    saveToken(token);
    setUser(user);
    setLoading(false);
  }

  async function login(data: LoginData) {
    startSession(await loginRequest(data));
  }

  async function register(data: RegisterData) {
    startSession(await registerRequest(data));
  }

  function logout() {
    clearToken();
    setUser(null);
    setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
