import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
async function proxy(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  const base = process.env.BACKEND_URL ?? "http://127.0.0.1:8080";
  const url = `${base}/api/tasks${path.length ? "/" + path.map(encodeURIComponent).join("/") : ""}`;
  // Reject cross-origin browser writes while keeping the API on the frontend's origin.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (request.method !== "GET" && origin && host) {
    let originHost: string;
    try { originHost = new URL(origin).host; }
    catch { return NextResponse.json({ message: "Invalid request origin." }, { status: 403 }); }
    if (originHost !== host) {
      return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
    }
  }
  try {
    const response = await fetch(url, {
      method: request.method,
      headers: { "Content-Type": "application/json", "X-Timezone": request.headers.get("x-timezone") ?? "UTC" },
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
      cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    return new NextResponse(response.status === 204 ? null : await response.text(), {
      status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ message: "Cannot reach the task server. Check that Spring Boot is running and try again." }, { status: 502 });
  }
}
export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
