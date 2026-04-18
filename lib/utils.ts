import { clsx } from "clsx";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function formatServices(services: string[] | null | undefined) {
  if (!services || services.length === 0) {
    return "Mechanic";
  }

  return services.join(", ");
}

export function parseServicesInput(raw: string) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
