"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

type HeaderProfile = {
  role: UserRole;
  full_name: string;
};

export function HeaderAuth() {
  const [profile, setProfile] = useState<HeaderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single<HeaderProfile>();

      setProfile(data ?? null);
      setLoading(false);
    }

    loadProfile();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/auth");
    router.refresh();
  }

  if (loading) {
    return (
      <Link href="/auth" className="button-secondary">
        Sign in
      </Link>
    );
  }

  if (!profile) {
    return (
      <Link href="/auth" className="button-secondary">
        Sign in
      </Link>
    );
  }

  return (
    <>
      <span className="role-badge">{profile.role}</span>
      <span className="muted header-name">{profile.full_name}</span>
      <button
        className="button-secondary"
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await handleSignOut();
          });
        }}
      >
        {isPending ? "Signing out..." : "Sign out"}
      </button>
    </>
  );
}
