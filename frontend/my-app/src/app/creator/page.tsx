"use client";

import { useState } from "react";
import { ProtectedRoute } from "../../components/protected-route";
import { useSession } from "../../components/session";
import { WorkspaceLayout } from "../../components/workspace-layout";
import { CreatorDashboard } from "../../components/workspaces";

export default function CreatorPage() {
  const { session } = useSession();
  const [notice, setNotice] = useState("");

  return (
    <ProtectedRoute role="creator">
      <WorkspaceLayout notice={notice}>
        <CreatorDashboard token={session?.token ?? ""} setNotice={setNotice} />
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
