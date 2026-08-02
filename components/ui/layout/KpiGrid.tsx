import { ReactNode } from "react";

type KpiGridProps = {
  children: ReactNode;
};

export default function KpiGrid({
  children,
}: KpiGridProps) {
  return (
    <div className="kpi-grid">
      {children}
    </div>
  );
}