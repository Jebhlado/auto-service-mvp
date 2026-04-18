let bookings: any[] = [];

const { data: bookingData } = await supabase
  .from("bookings")
  .select(`
    id,
    appointment_date,
    issue_description,
    status,
    provider_id,
    provider:provider_profiles (
      business_name,
      location,
      contact_email
    )
  `)
  .eq("customer_id", user.id)
  .order("created_at", { ascending: false });

bookings = bookingData ?? [];