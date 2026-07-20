export type UserRole = "customer" | "provider" | "admin";
export type BookingStatus = "pending" | "confirmed" | "rejected"| "in_progress" | "completed" | "closed"| "cancelled" ;;
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ProfileRecord = {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
};

export type ProviderProfileRecord = {
  is_active: boolean;
  user_id: string;
  business_name: string;
  services: string[];
  location: string;
  contact_email: string;
  contact_phone: string;
  bio: string | null;
  approval_status: ApprovalStatus;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
  } | null;
};

const { data: allCustomers } = await supabase
  .from("profiles")
  .select("*")
  .eq("role", "customer")
  .returns<ProfileRecord[]>()
  .order("created_at", {
    ascending: false,
  });

export type BookingRecord = {
  id: string;
  customer_id: string;
  provider_id: string;
  appointment_date: string;
  issue_description: string;

  provider_notes?: string | null;

  quote_labour?: number | null;
  quote_parts?: number | null;
  quote_total?: number | null;
  quote_notes?: string | null;
  quote_status?: string | null;
  quote_sent_at?: string | null;
  quote_approved_at?: string | null;
  quote_currency?: string | null;

  status: BookingStatus;
  created_at: string;

  customer?: {
    full_name: string;
    phone: string | null;
    email: string;
  } | null;

  provider?: {
    business_name: string;
    location: string;
  } | null;

  service_preference?: string | null;
  attachment_url?: string | null;
};

export type ReviewRecord = {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
};