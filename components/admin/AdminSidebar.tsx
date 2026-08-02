import AdminNavItem from "./AdminNavItem";

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <h2 className="admin-logo">
        AutoCare Admin
      </h2>

      <nav className="admin-nav">
        <AdminNavItem
          href="/admin"
          label="Dashboard"
        />

        <AdminNavItem
          href="/admin/providers"
          label="Providers"
        />

        <AdminNavItem
          href="/admin/bookings"
          label="Bookings"
        />

        <AdminNavItem
          href="/admin/customers"
          label="Customers"
        />

        <AdminNavItem
          href="/admin/analytics"
          label="Analytics"
        />

        <AdminNavItem
          href="/admin/settings"
          label="Settings"
        />
      </nav>
    </aside>
  );
}