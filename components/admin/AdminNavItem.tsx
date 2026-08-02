"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminNavItemProps = {
  href: string;
  label: string;
};

export default function AdminNavItem({
  href,
  label,
}: AdminNavItemProps) {
  const pathname = usePathname();

  const isActive =
    pathname === href ||
    (href !== "/admin" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`admin-nav-item ${
        isActive ? "admin-nav-item-active" : ""
      }`}
    >
      {label}
    </Link>
  );
}