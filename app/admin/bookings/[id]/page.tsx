import { notFound } from "next/navigation";
import Link from "next/link";

import { getBookings } from "@/app/admin/lib/admin";
import { formatCurrency } from "@/lib/formats";
import { getBookingAttachmentUrl } from "@/lib/attachments";
import PanelHeader from "@/components/ui/PanelHeader";
import PageSection from "@/components/ui/PageSection";
import StatTile from "@/components/ui/StatTile";

type BookingDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BookingDetailsPage({
  params,
}: BookingDetailsPageProps) {
  const { id } = await params;

  const bookings = await getBookings();

  const booking = bookings.find(
    (item) => item.id === id
  );

  if (!booking) {
    notFound();
  }

  const attachmentUrl = booking.attachment_url
    ? await getBookingAttachmentUrl(booking.id)
    : null;

  return (
    <>
      <PanelHeader
        eyebrow="Booking"
        title="Booking Details"
        description="View the complete details and status of this booking."
      />

      <div className="inline-actions">
        <Link
          href="/admin/bookings"
          className="button-secondary"
        >
          ← Back to Bookings
        </Link>
      </div>

      <PageSection
        title="Booking Overview"
        description="Core information about this service request."
      >
        <div className="dashboard-grid">
          <StatTile
            title="Status"
            value={booking.status.toUpperCase()}
          />

          <StatTile
            title="Appointment"
            value={new Date(
              booking.appointment_date
            ).toLocaleDateString()}
          />

          <StatTile
            title="Quote"
            value={formatCurrency(
              booking.quote_total ?? 0
            )}
          />
        </div>
      </PageSection>

      <PageSection
        title="Customer"
        description="Customer information associated with this booking."
      >
        <div className="card stack-sm">
          <strong>
            {booking.customer?.full_name ??
              "Unknown Customer"}
          </strong>

          <span>
            {booking.customer?.email ??
              "No email available"}
          </span>

          <span>
            {booking.customer?.phone ??
              "No phone number available"}
          </span>
        </div>
      </PageSection>

      <PageSection
        title="Service Provider"
        description="Provider assigned to this booking."
      >
        <div className="card stack-sm">
          <strong>
            {booking.provider?.business_name ??
              "Unknown Provider"}
          </strong>

          <span>
            {booking.provider?.location ??
              "No location available"}
          </span>
        </div>
      </PageSection>

      <PageSection
        title="Service Request"
        description="Details supplied by the customer."
      >
        <div className="card stack-sm">
          <div>
            <strong>Issue Description</strong>

            <p>
              {booking.issue_description ||
                "No issue description provided."}
            </p>
          </div>

          <div>
            <strong>Service Preference</strong>

            <p>
              {booking.service_preference ||
                "Not specified"}
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Quote"
        description="Quote information provided for this booking."
      >
        <div className="dashboard-grid">
          <StatTile
            title="Service Price"
            value={formatCurrency(
              booking.quote_service_price ?? 0
            )}
          />

          <StatTile
            title="Call-out Fee"
            value={formatCurrency(
              booking.quote_callout_fee ?? 0
            )}
          />

          <StatTile
            title="Total"
            value={formatCurrency(
              booking.quote_total ?? 0
            )}
          />

          <StatTile
            title="Estimated Time"
            value={booking.quote_estimated_time || "Not specified"}
          />

          <StatTile
            title="Warranty"
            value={booking.quote_warranty || "Not specified"}
          />
        </div>

        {booking.quote_notes ? (
          <div className="card">
            <strong>Quote Notes</strong>
            <p>{booking.quote_notes}</p>
          </div>
        ) : null}
      </PageSection>

      <PageSection
        title="Attachments"
        description="Files supplied with the booking."
      >
        {attachmentUrl ? (
          <div className="card">
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button-secondary"
            >
              View Attachment
            </a>
          </div>
        ) : (
          <p className="muted">
            No attachment was provided.
          </p>
        )}
      </PageSection>
    </>
  );
}