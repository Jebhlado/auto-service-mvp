import { ReactNode } from "react";

type PanelHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function PanelHeader({
  eyebrow,
  title,
  description,
  actions,
}: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <div className="panel-header-content">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}

        <h2 className="panel-title">{title}</h2>

        {description && (
          <p className="panel-description">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="panel-actions">
          {actions}
        </div>
      )}
    </div>
  );
}