"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "./session";

export function WorkspaceLayout({
  children,
  notice,
}: {
  children: ReactNode;
  notice?: string;
}) {
  const { session, signOut } = useSession();
  const router = useRouter();
  const role = session?.user.role ?? "creator";

  const logout = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand-lockup" href={role === "brand" ? "/brand" : "/creator"} aria-label="Meme&apos;d home">
          <span className="brand-mark">S</span>
          <span>Meme&apos;d<span className="brand-period">.</span></span>
        </Link>
        <div className="topbar-right">
          <span className={`role-pill ${role}`}>{role}</span>
          <span className="user-name">{session?.user.name}</span>
          <button className="button button-quiet signout" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <section className="welcome-band">
        <div>
          <p className="eyebrow">YOUR CREATOR ECONOMY, IN ONE PLACE</p>
          <h1>{role === "brand" ? "Campaign studio" : "Creator space"}</h1>
          <p className="welcome-copy">
            {role === "brand"
              ? "Launch campaigns and keep every rupee of your budget in view."
              : "Find your next collaboration and track what you have earned."}
          </p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <span className="art-orbit orbit-one" />
          <span className="art-orbit orbit-two" />
          <span className="art-meme">✳</span>
        </div>
      </section>

      {notice && (
        <div className="notice notice-error" role="alert">
          {notice}
        </div>
      )}

      {children}
      <footer className="site-footer">
        <span>Meme&apos;d Studio</span>
        <span>Campaigns that make an impact.</span>
      </footer>
    </main>
  );
}
