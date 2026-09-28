/** Default wait for first cocos host readiness (engine internal imports can be slow). */
export const DEFAULT_HOST_READY_TIMEOUT_MS = 600_000;

/**
 * Resolve host readiness timeout.
 * Priority: explicit ms → `--timeout` seconds → `KURENAI_HOST_READY_TIMEOUT_MS` → default 10m.
 */
export function resolveHostReadyTimeoutMs(
  options: { timeout?: string | true | undefined; readinessTimeoutMs?: number | undefined } = {},
  env: NodeJS.ProcessEnv = process.env,
): number {
  if (typeof options.readinessTimeoutMs === "number" && Number.isFinite(options.readinessTimeoutMs)) {
    return Math.max(1_000, options.readinessTimeoutMs);
  }
  if (typeof options.timeout === "string" && options.timeout.trim()) {
    const seconds = Number(options.timeout);
    if (Number.isFinite(seconds) && seconds > 0) return Math.max(1_000, Math.round(seconds * 1000));
  }
  const fromEnv = Number(env.KURENAI_HOST_READY_TIMEOUT_MS);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.max(1_000, Math.round(fromEnv));
  return DEFAULT_HOST_READY_TIMEOUT_MS;
}
