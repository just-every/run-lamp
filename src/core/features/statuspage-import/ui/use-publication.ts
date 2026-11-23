import { useEffect, useState } from "react";
import { appApi } from "../../../app/client/ui/api";

/** Poll only the public snapshot selector while the operator waits on this result. */
export function usePublication(result: object | null) {
  const [publishedResult, setPublishedResult] = useState<object | null>(null);
  const waiting = result !== null && result !== publishedResult;
  useEffect(() => {
    if (!waiting) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let revision: number | undefined;
    const startedAt = Date.now();
    async function check() {
      const query = revision === undefined ? "" : `?revision=${revision}`;
      const status = await appApi<{ revision: number; published: boolean }>(`/api/app/statuspage-import/publication${query}`, { signal: controller.signal }).catch(() => null);
      if (controller.signal.aborted) return;
      if (status) revision = status.revision;
      if (status?.published) setPublishedResult(result);
      else timer = setTimeout(check, Date.now() - startedAt < 60_000 ? 5_000 : 15_000);
    }
    void check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [result, waiting]);
  return waiting;
}
