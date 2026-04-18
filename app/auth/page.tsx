import { AuthForm } from "@/components/auth-form";

type AuthPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Access</div>
          <h1>Sign in or create your account</h1>
        </div>
      </div>

      {params.error ? (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <strong>Authentication issue</strong>
          <p className="muted">{params.error}</p>
        </div>
      ) : null}

      <AuthForm />
    </section>
  );
}
