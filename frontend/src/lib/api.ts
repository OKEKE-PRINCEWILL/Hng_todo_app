export async function api<T>(path = "", method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`/api/tasks${path}`, {
    method, headers: { "Content-Type": "application/json", "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone },
    body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Something went wrong. Please try again." }));
    throw new Error(error.message ?? "Something went wrong. Please try again.");
  }
  return response.status === 204 ? undefined as T : response.json();
}
