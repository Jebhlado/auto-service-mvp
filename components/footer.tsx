import { getPlatformSettings } from "@/lib/platform-settings";

export async function Footer() {
  const settings = await getPlatformSettings();
  const { platform_name, support_email, support_phone, default_region } = settings.general;

  return (
    <footer className="section" aria-label="Platform information">
      <div className="card stack-sm">
        <strong>{platform_name}</strong>
        {default_region ? <p className="muted">{default_region}</p> : null}
        {support_email || support_phone ? (
          <div className="inline-actions">
            {support_email ? <a href={`mailto:${support_email}`}>Support: {support_email}</a> : null}
            {support_phone ? <a href={`tel:${support_phone.replace(/[^+\d]/g, "")}`}>{support_phone}</a> : null}
          </div>
        ) : (
          <p className="muted">Customer support contact details will appear here when configured by an administrator.</p>
        )}
      </div>
    </footer>
  );
}
