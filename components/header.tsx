import Link from "next/link";
import { HeaderAuth } from "@/components/header-auth";

export async function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        AutoCare Connect
      </Link>

      <nav className="nav-links">
  <Link href="/customer">Customer</Link>
  <Link href="/provider">Provider dashboard</Link>
  <Link href="/admin">Admin</Link>
  <HeaderAuth />
</nav>
    </header>
  );
}
