import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
const AuthContext = createContext(null);
function readApiSession() {
  const session = api.read();
  if (session && (session.demo || !session.tokens?.accessToken || !session.tokens?.refreshToken || !session.user)) {
    api.clear();
    return null;
  }
  return session;
}
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readApiSession()),
    [booting, setBooting] = useState(true),
    [bootError, setBootError] = useState("");
  const expire = () => {
    api.clear();
    setSession(null);
  };
  async function bootstrap() {
    const s = readApiSession();
    setBootError("");
    if (!s) {
      setSession(s);
      setBooting(false);
      return;
    }
    setBooting(true);
    try {
      const user = await api.request("/auth/me");
      const next = { ...api.read(), user };
      api.save(next);
      setSession(next);
    } catch (error) {
      if (error.status === 401) {
        expire();
      } else setBootError(error.message);
    } finally {
      setBooting(false);
    }
  }
  useEffect(() => {
    bootstrap();
    window.addEventListener("vovinam:expired", expire);
    return () => window.removeEventListener("vovinam:expired", expire);
  }, []);
  const accept = (data) => {
    if (!data.tokens?.accessToken || !data.tokens?.refreshToken || !data.user)
      throw Error("Phản hồi đăng nhập thiếu thông tin phiên.");
    const next = { tokens: data.tokens, user: data.user };
    api.save(next);
    setSession(next);
  };
  const login = async (body) => {
    const data = await api.request("/auth/login", {
      method: "POST",
      body,
      public: true,
    });
    if (data.mfaRequired) return data;
    accept(data);
    return data;
  };
  const verifyMfa = async (body) =>
    accept(
      await api.request("/auth/mfa/login-verify", {
        method: "POST",
        body,
        public: true,
      }),
    );
  const logout = async () => {
    await api.request("/auth/logout", { method: "POST" });
    expire();
  };
  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user,
        booting,
        bootError,
        retryBoot: bootstrap,
        expire,
        login,
        verifyMfa,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
