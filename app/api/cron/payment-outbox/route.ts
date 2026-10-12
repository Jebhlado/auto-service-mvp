import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { processPaymentOutboxBatch } from "@/lib/payment-outbox";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await processPaymentOutboxBatch(25);
    return NextResponse.json({ ok: result.failed === 0, ...result }, {
      status: result.failed === 0 ? 200 : 207,
    });
  } catch (error) {
    console.error("Payment outbox cron failed", error);
    return new NextResponse("Payment outbox processing failed", { status: 500 });
  }
}
