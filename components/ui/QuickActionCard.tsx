import Link from "next/link";
import { ReactNode } from "react";
import type { Route } from "next";

type QuickActionCardProps = {
  title: string;
  description: string;
  href: Route;
  actionLabel?: string;
  icon?: ReactNode;
};

export default function QuickActionCard({
  title,
  description,
  href,
  actionLabel = "Open",
  icon,
}: QuickActionCardProps) {
  return (
    <div className="quick-action-card">
      <div className="quick-action-header">
        {icon && (
          <div className="quick-action-icon">
            {icon}
          </div>
        )}

        <h3>{title}</h3>
      </div>

      <p>{description}</p>

      <Link
        href={href}
        className="button-secondary"
      >
        {actionLabel}
      </Link>
    </div>
  );
}