import "server-only";

type PayfastConfig = {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  processUrl: string;
  sandbox: boolean;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPayfastConfig(): PayfastConfig {
  const sandbox = process.env.PAYFAST_SANDBOX === "true";

  return {
    merchantId: getRequiredEnv("PAYFAST_MERCHANT_ID"),
    merchantKey: getRequiredEnv("PAYFAST_MERCHANT_KEY"),
    passphrase: getRequiredEnv("PAYFAST_PASSPHRASE"),
    processUrl: sandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process",
    sandbox
  };
}
