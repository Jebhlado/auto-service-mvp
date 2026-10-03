import Link from "next/link";
import { HeaderAuth } from "@/components/header-auth";
import { getPlatformSettings } from "@/lib/platform-settings";

export async function Header() {
  const settings = await getPlatformSettings();
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        {settings.general.platform_name}
      </Link>

      <nav className="nav-links">
  <Link href="/customer">Customer</Link>
  <Link href="/provider">Provider dashboard</Link>
  <HeaderAuth />
</nav>
    </header>
  );
}
