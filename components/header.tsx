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
  <HeaderAuth />
</nav>
    </header>
  );
}
