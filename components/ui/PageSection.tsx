import { ReactNode } from "react";

type PageSectionProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function PageSection({
  title,
  description,
  actions,
  children,
}: PageSectionProps) {
  return (
    <section className="page-section">
      {(title || description || actions) && (
        <div className="page-section-header">
          <div>
            {title && (
              <h2 className="page-section-title">
                {title}
              </h2>
            )}

            {description && (
              <p className="page-section-description">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="page-section-actions">
              {actions}
            </div>
          )}
        </div>
      )}

      {children}
    </section>
  );
}