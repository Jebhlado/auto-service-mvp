import { getCustomers } from "@/app/admin/lib/admin";
import type { CustomerSummary } from "@/lib/types";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
  }>;
}) {
  const { search = "" } = await searchParams;

const customers = (await getCustomers(
  search
)) as CustomerSummary[];

  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">Customers</div>

          <h2>Customer Management</h2>

          <p className="muted">
            View and manage registered customers.
          </p>
          <form
          method="GET"
          className="inline-actions"
        >
          <input
            type="search"
            name="search"
            placeholder="Search customers..."
            defaultValue={search}
          />

          <button type="submit">
            Search
          </button>

          {search && (
            <a href="/admin/customers">
              Clear
            </a>
          )}
        </form>
        </div>
      </div>

      <div className="card stack-md">
        <div className="eyebrow">All Customers</div>

        {customers.length ? (
          customers.map((customer) => (
            <article
              key={customer.id}
              className="card stack-sm"
            >
              <strong>{customer.full_name}</strong>

              <span>{customer.email}</span>

              <span>
                {customer.phone ?? "No phone number"}
              </span>

              <span className="muted">
                Joined{" "}
                {new Date(
                  customer.created_at
                ).toLocaleDateString()}
              </span>
              <div className="stats-grid">

              <div className="card">
                <strong>{customer.totalBookings}</strong>
                <p>Total Bookings</p>
              </div>

              <div className="card">
                <strong>{customer.completedJobs}</strong>
                <p>Completed Jobs</p>
              </div>

              <div className="card">
                <strong>
                {new Intl.NumberFormat("en-ZA", {
                  style: "currency",
                  currency: "ZAR",
                  minimumFractionDigits: 0,
                }).format(customer.totalSpent)}
              </strong>
                <p>Total Spent</p>
              </div>
            </div>
            </article>
          ))
        ) : (
          <p className="muted">
          {search
            ? `No customers found for "${search}".`
            : "No customers found."}
        </p>
        )}
      </div>
    </>
  );
}
