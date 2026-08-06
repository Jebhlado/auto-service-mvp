import Link from "next/link";
import { ReactNode } from "react";

type StatTileProps = {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  subtitle?: ReactNode;
  href?: string;
};

export default function StatTile({
  title,
  value,
  icon,
  subtitle,
  href,
}: StatTileProps) {
  const content = (
    <div className="card stat-tile">
      {icon && (
        <div className="stat-icon-wrapper">
          <div className="stat-icon">
            {icon}
          </div>
        </div>
      )}

      <div className="stat-content">
        <div className="stat-value">{value}</div>

        <div className="stat-title">{title}</div>

        {subtitle && (
          <div className="stat-subtitle">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      className="stat-tile-link"
    >
      {content}
    </Link>
  );
}