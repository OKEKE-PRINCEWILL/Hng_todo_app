import { NextResponse } from "next/server";
import { requestBackend } from "@/lib/backend-request";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8080";

  try {
    const response = await requestBackend(`${backendUrl}/actuator/health`, {
      method: "GET",
      cache: "no-store",
    });
    return new NextResponse(response.status === 204 ? null : await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ status: "DOWN" }, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
