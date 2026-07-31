"use client";

import { usePathname } from "next/navigation";
import ContentCalibrationAdminPanel from "./ContentCalibrationAdminPanel";

export default function ContentCalibrationAdminMount({ children }) {
  const pathname = usePathname();
  return (
    <>
      {children}
      {pathname === "/admin" && (
        <section className="page">
          <ContentCalibrationAdminPanel />
        </section>
      )}
    </>
  );
}
