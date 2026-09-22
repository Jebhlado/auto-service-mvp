import "server-only";

import crypto from "node:crypto";

export function generatePayfastSignature(
  data: Record<string, string>,
  passphrase?: string,
  excludedFields: readonly string[] = []
): string {
  const encodePayfastValue = (value: string) =>
    encodeURIComponent(value.trim())
      .replace(/%20/g, "+")
      .replace(/[!'()*~]/g, (character) =>
        `%${character.charCodeAt(0).toString(16).toUpperCase()}`
      );

  const fields = Object.entries(data)
    .filter(
      ([key, value]) =>
        value !== "" && !excludedFields.includes(key)
    )
    .map(
      ([key, value]) =>
        `${key}=${encodePayfastValue(value)}`
    );

  if (passphrase) {
    fields.push(
      `passphrase=${encodePayfastValue(passphrase)}`
    );
  }

  const parameterString = fields.join("&");

  return crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex");
}

export function generatePayfastSignatureFromParameterString(
  parameterString: string,
  passphrase?: string
): string {
  const passphrasePart = passphrase
    ? `&passphrase=${encodeURIComponent(
        passphrase.trim()
      )
        .replace(/%20/g, "+")
        .replace(/[!'()*~]/g, (character) =>
          `%${character
            .charCodeAt(0)
            .toString(16)
            .toUpperCase()}`
        )}`
    : "";

  return crypto
    .createHash("md5")
    .update(
      `${parameterString}${passphrasePart}`
    )
    .digest("hex");
}