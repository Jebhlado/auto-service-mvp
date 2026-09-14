import "server-only";

import crypto from "node:crypto";

export function generatePayfastSignature(
  data: Record<string, string>,
  passphrase?: string,
  excludedFields: readonly string[] = []
): string {
  const fields = Object.entries(data)
    .filter(
      ([key, value]) =>
        value !== "" && !excludedFields.includes(key)
    )
    .map(
      ([key, value]) =>
        `${key}=${encodeURIComponent(value).replace(/%20/g, "+")}`
    );

  if (passphrase) {
    fields.push(
      `passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
    );
  }

  const parameterString = fields.join("&");

  return crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex");
}
