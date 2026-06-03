export type UserRole = "customer" | "provider" | "admin";
export type BookingStatus = "pending" | "confirmed" | "rejected";
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

export type BookingRecord = {
  id: string;
  customer_id: string;
  provider_id: string;
  appointment_date: string;
  issue_description: string;
  status: BookingStatus;
  created_at: string;
  customer?: {
    full_name: string;
    phone: string | null;
  } | null;
  provider?: {
    business_name: string;
    location: string;
  } | null;
  service_preference?: string | null;
attachment_url?: string | null;
};
