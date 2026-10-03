import { redirect } from "next/navigation";

export default function CompleteProviderProfile() {
  redirect("/provider?onboarding=1");
}
