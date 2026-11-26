import assert from "node:assert/strict";
import { setTimeout as wait } from "node:timers/promises";

/** Submit the same anonymous challenge and form as a public browser. */
export async function submitPublicSubscription(fetcher, url, init, { waitForChallenge = wait, allowMissingChallenge = false } = {}) {
  const headers = new Headers(init.headers);
  const challengeHeaders = new Headers(headers);
  challengeHeaders.delete("Content-Type");
  challengeHeaders.set("Accept", "application/json");
  const challenge = await fetcher(new URL("/subscribe/challenge", url).href, {
    method: "GET", headers: Object.fromEntries(challengeHeaders),
  });
  if (allowMissingChallenge && challenge.status === 404) return fetcher(url, init);
  assert.equal(challenge.status, 200, "the public Worker issues a subscription challenge");
  const { token, waitMs, expiresInMs } = await challenge.json();
  assert.ok(typeof token === "string" && token.length > 0, "the challenge includes a token");
  assert.ok(Number.isFinite(waitMs) && waitMs >= 0, "the challenge specifies how long to wait");
  await waitForChallenge(waitMs, expiresInMs);

  const body = new URLSearchParams(init.body);
  body.set("subscribeToken", token);
  body.set("subscribeWebsite", "");
  headers.set("Content-Type", "application/x-www-form-urlencoded");
  return fetcher(url, { ...init, headers: Object.fromEntries(headers), body: body.toString() });
}

async function setSubscriptionClock(fetcher, now, allowRewind = false) {
  const response = await fetcher("/test/clock", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ now, allowRewind }),
  });
  assert.equal(response.status, 204, await response.text());
}

/** Age a challenge on a frozen fixture clock without moving the POST boundary. */
export async function submitPublicSubscriptionAt(fetcher, url, init, now, setClock = (time, rewind) => setSubscriptionClock(fetcher, time, rewind)) {
  const age = 5_000;
  await setClock(now - age, true);
  let restored = false;
  try {
    return await submitPublicSubscription(fetcher, url, init, { waitForChallenge: async (waitMs, expiresInMs) => {
      assert.ok(waitMs <= age && age < expiresInMs, "the fixed test clock leaves the issued challenge usable");
      await setClock(now);
      restored = true;
    } });
  } finally {
    if (!restored) await setClock(now);
  }
}
