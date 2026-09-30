import { afterEach, describe, expect, it, vi } from "vitest";
import { requestBackend } from "./backend-request";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestBackend", () => {
  it("retries a failed read request once", async () => {
    const backendFetch = vi.fn()
      .mockRejectedValueOnce(new Error("backend is waking"))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", backendFetch);

    const response = await requestBackend("https://backend.test/api/tasks", { method: "GET" }, {
      readTimeoutsMs: [10, 10],
      retryDelayMs: 0,
    });

    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledTimes(2);
  });

  it("retries a temporary gateway response for reads", async () => {
    const backendFetch = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", backendFetch);

    const response = await requestBackend("https://backend.test/api/tasks", { method: "GET" }, {
      readTimeoutsMs: [10, 10],
      retryDelayMs: 0,
    });

    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry mutations", async () => {
    const backendFetch = vi.fn().mockRejectedValue(new Error("connection lost"));
    vi.stubGlobal("fetch", backendFetch);

    await expect(requestBackend("https://backend.test/api/tasks", {
      method: "POST",
      body: "{}",
    }, { writeTimeoutMs: 10, retryDelayMs: 0 })).rejects.toThrow("connection lost");
    expect(backendFetch).toHaveBeenCalledTimes(1);
  });
});
