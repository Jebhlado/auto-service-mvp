import PageSection from "@/components/ui/PageSection";
import { createClient } from "@/lib/supabase/server";
import { savePlatformSettingsAction } from "./actions";

type SettingsRecord = {
  general: {
    platform_name?: string;
    support_email?: string;
    support_phone?: string;
    default_region?: string;
  } | null;
  payments: { platform_fee_percent?: number } | null;
  provider_management: {
    require_approval?: boolean;
    service_categories?: string[];
  } | null;
  booking_rules: { customer_cancellation_enabled?: boolean } | null;
  notifications: {
    email_enabled?: boolean;
    booking_updates?: boolean;
    quote_updates?: boolean;
    payment_updates?: boolean;
    completion_updates?: boolean;
  } | null;
  updated_at?: string;
  updated_by?: string | null;
};

const DEFAULT_SETTINGS: SettingsRecord = {
  general: {
    platform_name: "Mechanic Connect",
    support_email: "",
    support_phone: "",
    default_region: "Gauteng, South Africa",
  },
  payments: { platform_fee_percent: 15 },
  provider_management: {
    require_approval: true,
    service_categories: ["Mechanic", "Auto electrician", "Panel beater"],
  },
  booking_rules: { customer_cancellation_enabled: true },
  notifications: {
    email_enabled: true,
    booking_updates: true,
    quote_updates: true,
    payment_updates: true,
    completion_updates: true,
  },
};

type SettingsPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="stack-sm">
      <span><strong>{label}</strong></span>
      <input
        className="settings-input"
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={name === "platform_name" || name === "default_region"}
        min={type === "number" ? 0 : undefined}
        max={type === "number" ? 30 : undefined}
        step={type === "number" ? 0.5 : undefined}
      />
      {hint ? <span className="muted settings-hint">{hint}</span> : null}
    </label>
  );
}

function Toggle({
  name,
  label,
  description,
  checked,
}: {
  name: string;
  label: string;
  description: string;
  checked: boolean;
}) {
  return (
    <label className="settings-toggle">
      <span className="settings-toggle-copy">
        <strong>{label}</strong>
        <span className="muted">{description}</span>
      </span>
      <input type="checkbox" name={name} defaultChecked={checked} />
    </label>
  );
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("general, payments, provider_management, booking_rules, notifications, updated_at, updated_by")
    .eq("id", "default")
    .maybeSingle();

  const settings = (data as SettingsRecord | null) ?? DEFAULT_SETTINGS;
  const general = settings.general ?? DEFAULT_SETTINGS.general!;
  const payments = settings.payments ?? DEFAULT_SETTINGS.payments!;
  const providers = settings.provider_management ?? DEFAULT_SETTINGS.provider_management!;
  const bookingRules = settings.booking_rules ?? DEFAULT_SETTINGS.booking_rules!;
  const notifications = settings.notifications ?? DEFAULT_SETTINGS.notifications!;
  const categories = providers.service_categories ?? DEFAULT_SETTINGS.provider_management!.service_categories!;

  const errorMessages: Record<string, string> = {
    required: "Platform name and default region are required.",
    email: "Enter a valid support email address.",
    fee: "Platform fee must be between 0% and 30%.",
    categories: "Enter at least one service category.",
    save: "Settings could not be saved. Confirm the database migration has been applied and try again.",
  };

  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">Administration</div>
          <h1>Platform Settings</h1>
          <p className="muted">
            Manage platform details and operational preferences from one secure workspace.
          </p>
        </div>
        <span className="status-chip status-confirmed">Admin only</span>
      </div>

      {params.success === "saved" ? (
        <div className="card settings-notice settings-notice-success" role="status">
          <strong>Settings saved</strong>
          <p className="muted">Your platform settings were saved to the database.</p>
        </div>
      ) : null}

      {params.error && errorMessages[params.error] ? (
        <div className="card settings-notice settings-notice-error" role="alert">
          <strong>Unable to save settings</strong>
          <p className="muted">{errorMessages[params.error]}</p>
        </div>
      ) : null}

      {error ? (
        <div className="card settings-notice settings-notice-error" role="alert">
          <strong>Settings storage is not ready</strong>
          <p className="muted">
            Apply the SQL migration in <code>Supabase/AdminSettings.sql</code> in your Supabase SQL Editor. Current form values are defaults and will not be saved until the table exists.
          </p>
        </div>
      ) : null}

      <form action={savePlatformSettingsAction} className="settings-form stack-md">
        <PageSection title="General settings" description="The public-facing platform identity and customer support contact details.">
          <div className="settings-grid">
            <Field label="Platform name" name="platform_name" defaultValue={general.platform_name ?? "Mechanic Connect"} />
            <Field label="Support email" name="support_email" type="email" defaultValue={general.support_email ?? ""} />
            <Field label="Support phone" name="support_phone" defaultValue={general.support_phone ?? ""} />
            <Field label="Default region" name="default_region" defaultValue={general.default_region ?? "Gauteng, South Africa"} />
          </div>
          <p className="muted settings-hint">These values are stored centrally. App-wide branding and contact links need to be connected to these settings separately.</p>
        </PageSection>

        <PageSection title="Payments and platform fees" description="Configure the platform fee preference. PayFast credentials are deliberately not editable or displayed here.">
          <div className="settings-grid">
            <Field
              label="Platform fee (%)"
              name="platform_fee_percent"
              type="number"
              defaultValue={payments.platform_fee_percent ?? 15}
              hint="This percentage is saved, but payment creation still uses the existing database function. We will connect and test the transaction calculation separately before relying on this value."
            />
            <div className="settings-info-card">
              <strong>PayFast configuration</strong>
              <p className="muted">Credentials remain in server-side environment variables. Use Vercel project settings to manage secrets and sandbox/live mode.</p>
            </div>
          </div>
        </PageSection>

        <PageSection title="Provider management" description="Control provider approval and the service categories available in provider profiles and customer search.">
          <div className="stack-md">
            <Toggle
              name="require_approval"
              label="Require administrator approval"
              description="When enabled, provider profiles remain pending until an administrator approves them. When disabled, a valid provider profile is approved and activated automatically."
              checked={providers.require_approval ?? true}
            />
            <label className="stack-sm">
              <strong>Service categories</strong>
              <textarea className="settings-input settings-textarea" name="service_categories" rows={3} defaultValue={categories.join(", ")} required />
              <span className="muted settings-hint">Separate categories with commas. These categories are used by provider profile forms and customer service search.</span>
            </label>
          </div>
        </PageSection>

        <PageSection title="Booking rules" description="Control whether customers may cancel eligible bookings from the customer dashboard.">
          <Toggle
            name="customer_cancellation_enabled"
            label="Allow customer cancellation"
            description="When disabled, the server rejects customer cancellation requests. Existing booking status eligibility rules still apply when enabled."
            checked={bookingRules.customer_cancellation_enabled ?? true}
          />
        </PageSection>

        <PageSection title="Notifications" description="Control email and in-app notifications by category. Essential authentication messages outside this notification service are unaffected.">
          <div className="stack-sm">
            <Toggle name="email_enabled" label="Email notifications" description="Email notifications as a platform preference." checked={notifications.email_enabled ?? true} />
            <Toggle name="booking_updates" label="Booking updates" description="Booking requests and booking status changes." checked={notifications.booking_updates ?? true} />
            <Toggle name="quote_updates" label="Quote updates" description="Quote sent, approved, or declined." checked={notifications.quote_updates ?? true} />
            <Toggle name="payment_updates" label="Payment updates" description="Payment-related notifications." checked={notifications.payment_updates ?? true} />
            <Toggle name="completion_updates" label="Completion updates" description="Job completion and customer confirmation." checked={notifications.completion_updates ?? true} />
          </div>
        </PageSection>

        <div className="card settings-savebar">
          <div>
            <strong>Save platform settings</strong>
            <p className="muted">Only administrators can load or update these settings. Never enter passwords, API keys, merchant keys or passphrases here.</p>
            {settings.updated_at ? <p className="muted settings-hint">Last saved: {new Date(settings.updated_at).toLocaleString("en-ZA")}</p> : null}
          </div>
          <button type="submit" className="button-primary">Save settings</button>
        </div>
      </form>
    </>
  );
}
