import React, { createContext, useContext, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const KEY = 'rf_session';

export const DEMO_USERS = {
  researcher: { name: 'Santhosh Kumar', email: 'santhosh.kumar@researchflow.app', role: 'researcher' },
  supervisor: { name: 'Dr. Meera Nair', email: 'meera.nair@researchflow.app', role: 'supervisor' },
  admin: { name: 'Arjun Patel', email: 'admin@researchflow.app', role: 'admin' },
};

const Ctx = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSessionState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY));
    } catch (e) {
      return null;
    }
  });
  const setSession = (s) => {
    setSessionState(s);
    try {
      if (s) localStorage.setItem(KEY, JSON.stringify(s));
      else localStorage.removeItem(KEY);
    } catch (e) {}
  };
  const switchRole = (role) => setSession(DEMO_USERS[role]);
  const setAvatar = (avatar) => {
    setSessionState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, avatar };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  return <Ctx.Provider value={{ session, setSession, switchRole, setAvatar }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);

export function RequireAuth({ children }) {
  const { session } = useSession();
  const loc = useLocation();
  if (!session) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}
