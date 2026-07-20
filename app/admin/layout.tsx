import Link from "next/link";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin"]);

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Admin</div>
          <h1>Administration</h1>
        </div>
      </div>

      <nav className="inline-actions">
        <Link href="/admin" className="button-secondary">
          Dashboard
        </Link>

        <Link href="/admin/providers" className="button-secondary">
          Providers
        </Link>

        <Link href="/admin/customers" className="button-secondary">
          Customers
        </Link>

        <Link href="/admin/bookings" className="button-secondary">
          Bookings
        </Link>

        <Link href="/admin/analytics" className="button-secondary">
          Analytics
        </Link>
      </nav>

      {children}
    </section>
  );
}