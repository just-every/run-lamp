import { useEffect, useRef, useState } from "react";
import { ApiError, appApi } from "../../../app/client/ui/api";

type PublicationResponse = { state: "pending" | "confirmed" | "private" } | { state: "failed"; buildStartedAt: string };
type Publication = { state: "checking" | "pending" | "confirmed" | "private" } | { state: "failed"; message: string };

const CHECK_LIMIT_MS = 5 * 60_000;

export function useReportPublication(path: string | null) {
  const [observation, setObservation] = useState<{ path: string; publication: Publication } | null>(null);
  const [retry, setRetry] = useState<{ path: string } | null>(null);
  const lastRetry = useRef<typeof retry>(null);
  const publication = observation?.path === path ? observation.publication : { state: "checking" } as const;

  useEffect(() => {
    if (!path) return;
    const endpoint = path;
    const controller = new AbortController();
    const { signal } = controller;
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let queuedAt: string | undefined;
    const record = (publication: Publication) => setObservation({ path, publication });
    const fail = (message: string) => record({ state: "failed", message });
    const deadline = setTimeout(() => {
      controller.abort();
      clearTimeout(timer);
      fail("Lamp could not confirm the report on the incident page. Lamp retries the page build every minute.");
    }, CHECK_LIMIT_MS);

    async function check() {
      try {
        const status = await appApi<PublicationResponse>(endpoint, { signal });
        if (signal.aborted) return;
        if (status.state === "confirmed" || status.state === "private") {
          clearTimeout(deadline);
          record(status);
          return;
        }
        // The latest build can still be the failure that prompted this retry.
        if (status.state === "failed" && (!queuedAt || status.buildStartedAt >= queuedAt)) {
          clearTimeout(deadline);
          fail("The incident page build failed. Lamp retries the page build every minute.");
          return;
        }
        record({ state: "pending" });
      } catch (cause) {
        if (signal.aborted) return;
        if (cause instanceof ApiError && cause.status < 500) {
          clearTimeout(deadline);
          fail(cause.message);
          return;
        }
      }
      timer = setTimeout(check, Date.now() - started < 60_000 ? 2_000 : 15_000);
    }

    async function start() {
      if (retry?.path === endpoint && lastRetry.current !== retry) {
        lastRetry.current = retry;
        try { ({ queuedAt } = await appApi<{ queuedAt: string }>(endpoint, { method: "POST", signal })); }
        catch (cause) {
          if (signal.aborted) return;
          clearTimeout(deadline);
          fail(cause instanceof ApiError ? cause.message : "Lamp could not request a retry. Try again in a moment.");
          return;
        }
      }
      if (!signal.aborted) void check();
    }
    void start();
    return () => { controller.abort(); clearTimeout(deadline); clearTimeout(timer); };
  }, [path, retry]);

  return { publication, retryPublication: () => {
    if (!path) return;
    setObservation({ path, publication: { state: "checking" } });
    setRetry({ path });
  } };
}
