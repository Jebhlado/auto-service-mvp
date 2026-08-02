import "./admin.css";
import { requireRole } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin"]);

  return (
    <AdminShell>
      <section className="section">
        {children}
      </section>
    </AdminShell>
  );
}