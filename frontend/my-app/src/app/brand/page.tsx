"use client";

import { useState } from "react";
import { ProtectedRoute } from "../../components/protected-route";
import { useSession } from "../../components/session";
import { WorkspaceLayout } from "../../components/workspace-layout";
import { BrandDashboard } from "../../components/workspaces";

export default function BrandPage() {
  const { session } = useSession();
  const [notice, setNotice] = useState("");

  return (
    <ProtectedRoute role="brand">
      <WorkspaceLayout notice={notice}>
        <BrandDashboard token={session?.token ?? ""} setNotice={setNotice} />
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
