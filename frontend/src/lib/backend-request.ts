const READ_TIMEOUTS_MS = [20_000, 35_000];
const WRITE_TIMEOUT_MS = 45_000;
const RETRY_DELAY_MS = 1_000;
const RETRYABLE_STATUSES = new Set([502, 503, 504]);

type RetrySettings = {
  readTimeoutsMs?: number[];
  writeTimeoutMs?: number;
  retryDelayMs?: number;
};

function isReadRequest(method: string | undefined) {
  return method === undefined || method === "GET" || method === "HEAD";
}

function wait(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export async function requestBackend(
  url: string,
  init: RequestInit,
  settings: RetrySettings = {},
) {
  const readRequest = isReadRequest(init.method);
  const timeouts = readRequest
    ? settings.readTimeoutsMs ?? READ_TIMEOUTS_MS
    : [settings.writeTimeoutMs ?? WRITE_TIMEOUT_MS];
  const retryDelay = settings.retryDelayMs ?? RETRY_DELAY_MS;

  for (let attempt = 0; attempt < timeouts.length; attempt += 1) {
    const finalAttempt = attempt === timeouts.length - 1;

    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeouts[attempt]),
      });
      if (finalAttempt || !RETRYABLE_STATUSES.has(response.status)) return response;
      await response.body?.cancel();
    } catch (error) {
      if (finalAttempt) throw error;
    }

    await wait(retryDelay);
  }

  throw new Error("Backend request failed without a response.");
}
