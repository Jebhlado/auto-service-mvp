import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";

type AdminShellProps = {
  children: ReactNode;
};

export default function AdminShell({
  children,
}: AdminShellProps) {
  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}