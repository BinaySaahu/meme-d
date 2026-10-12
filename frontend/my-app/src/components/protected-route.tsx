"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { Role } from "./workspaces";
import { rolePath, useSession } from "./session";

export function ProtectedRoute({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const { session, isReady } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isReady && (!session || session.user.role !== role)) {
      router.replace(session ? rolePath(session.user.role) : "/login");
    }
  }, [isReady, role, router, session]);

  if (!isReady || !session || session.user.role !== role) {
    return (
      <main className="boot-screen" aria-live="polite">
        <span className="brand-mark">S</span>
        <p>{isReady ? "Taking you to your workspace…" : "Checking your session…"}</p>
      </main>
    );
  }

  return children;
}
