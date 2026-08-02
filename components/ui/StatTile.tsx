import { ReactNode } from "react";

type StatTileProps = {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  subtitle?: ReactNode;
};

export default function StatTile({
  title,
  value,
  icon,
  subtitle,
}: StatTileProps) {
  return (
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
}