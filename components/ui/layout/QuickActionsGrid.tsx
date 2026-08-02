import { ReactNode } from "react";

type QuickActionsGridProps = {
  children: ReactNode;
};

export default function QuickActionsGrid({
  children,
}: QuickActionsGridProps) {
  return (
    <div className="quick-actions-grid">
      {children}
    </div>
  );
}