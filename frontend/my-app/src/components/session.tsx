"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { AuthResponse, Role } from "./workspaces";

const SESSION_KEY = "campaign-payout-session";
const SESSION_EVENT = "meme-session-change";

interface SessionContextValue {
  session: AuthResponse | null;
  isReady: boolean;
  signIn: (session: AuthResponse) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(SESSION_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SESSION_EVENT, onChange);
  };
}

function getSnapshot(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

function getServerSnapshot(): null {
  return null;
}

function subscribeHydration(): () => void {
  return () => undefined;
}

function getHydrationSnapshot(): boolean {
  return true;
}

function getServerHydrationSnapshot(): boolean {
  return false;
}

function parseSession(snapshot: string | null): AuthResponse | null {
  if (!snapshot) {
    return null;
  }

  try {
    const session: AuthResponse = JSON.parse(snapshot);
    if (
      typeof session.token === "string" &&
      session.token.length > 0 &&
      typeof session.user?.id === "string" &&
      typeof session.user.name === "string" &&
      typeof session.user.email === "string" &&
      (session.user.role === "brand" || session.user.role === "creator")
    ) {
      return session;
    }
  } catch {
    return null;
  }

  return null;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isReady = useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot
  );
  const session = parseSession(snapshot);

  const signIn = useCallback((nextSession: AuthResponse) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    window.dispatchEvent(new Event(SESSION_EVENT));
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event(SESSION_EVENT));
  }, []);

  const value = useMemo(
    () => ({ session, isReady, signIn, signOut }),
    [session, isReady, signIn, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return context;
}

export function rolePath(role: Role): string {
  return role === "brand" ? "/brand" : "/creator";
}
