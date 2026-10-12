"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthScreen } from "./workspaces";
import { rolePath, useSession } from "./session";
import type { AuthResponse } from "./workspaces";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { session, isReady, signIn } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isReady && session) {
      router.replace(rolePath(session.user.role));
    }
  }, [isReady, router, session]);

  const onSuccess = (nextSession: AuthResponse) => {
    signIn(nextSession);
    router.replace(rolePath(nextSession.user.role));
  };

  if (!isReady || session) {
    return (
      <main className="boot-screen">
        <span className="brand-mark">S</span>
        <p>Opening your workspace…</p>
      </main>
    );
  }

  return <AuthScreen mode={mode} onSuccess={onSuccess} />;
}
