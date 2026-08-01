"use client";

import { usePathname } from "next/navigation";
import LocalExerciseWorkshopPanel from "./LocalExerciseWorkshopPanel";
import LocalBackupRestorePanel from "./LocalBackupRestorePanel";
import ContentCalibrationAdminPanel from "./ContentCalibrationAdminPanel";
import ManualPedagogicalAuditPanel from "./ManualPedagogicalAuditPanel";
import AdminWritingRevisionHistory from "./AdminWritingRevisionHistory";

export default function ContentCalibrationAdminMount({ children }) {
  const pathname = usePathname();
  return (
    <>
      {children}
      {pathname === "/admin" && (
        <section className="page">
          <LocalExerciseWorkshopPanel />
          <LocalBackupRestorePanel />
          <ContentCalibrationAdminPanel />
          <ManualPedagogicalAuditPanel />
          <AdminWritingRevisionHistory />
        </section>
      )}
    </>
  );
}
