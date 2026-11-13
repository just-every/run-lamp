import { Link } from "@tanstack/react-router";

import type { LiveStatus } from "../live-status";
import { useOperatorTime } from "../../../app/client/ui/states";

/** The installation's page, publication and checks. A failing check turns it amber with
 * its reason and the one thing to do; nothing here asks the owner to run a check. */
export function LiveStrip({ live }: { live: LiveStatus }) {
  const formatOperatorTime = useOperatorTime();
  const host = new URL(live.publicOrigin).host;
  const address = <a className="live-address" href={`${live.publicOrigin}/`} target="_blank" rel="noopener">{host}</a>;
  // A page that does not answer fails both checks for the same reason; say it once.
  const problems = [...new Set([live.page, live.subscribe].flatMap((check) => check && !check.ok && check.reason ? [check.reason] : []))];
  if (!live.senderVerificationManaged && live.sender.state === "failed" && live.sender.message) problems.push(`Mail sender: ${live.sender.message}`);
  if (!live.publishedAt && !live.preview) return <section className="live-strip" aria-label="Your public page"><span className="live-dot is-pending" />Publishing {address}…</section>;
  const checkedAt = live.page?.checkedAt;
  return <section className={`live-strip${problems.length ? " is-failing" : ""}`} aria-label={live.preview ? "Your preview copy" : "Your public page"}>
    <p><span className={`live-dot${problems.length ? " is-failing" : ""}`} />{live.preview ? "Preview copy at " : "Live at "}{address}<span className="live-sep">·</span><span className="live-fact">{live.publishedAt ? <>{live.preview ? "preview last published " : "published "}{formatOperatorTime(live.publishedAt)}</> : "Preparing preview…"}</span>{checkedAt && !problems.length ? <><span className="live-sep">·</span><span className="live-fact">page and subscribe form checked {formatOperatorTime(checkedAt)}</span></> : null}<span className="live-sep">·</span><Link className="live-link" to="/app/page">Review page</Link>{!live.preview && <><span className="live-sep">·</span><Link className="live-link" to="/app/settings">Change address</Link></>}</p>
    {live.preview ? <p className="live-fact">This is not your customers’ address. No subscribers are notified. Return to RunEditRun and publish this version to make it live.</p> : null}
    {live.senderVerificationManaged ? <p className="live-fact">Mail sender: Uses the RunEditRun relay; sender domain checks are managed there.</p> : null}
    {problems.map((problem) => <p key={problem} className="live-problem" role="status">{problem}</p>)}
  </section>;
}
