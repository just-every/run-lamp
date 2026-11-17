# Before-edit observations

Parent confirmed: 92aa684cf150afdc9472a238fb08ed5cfdfb61de.
Failed job read first: Verify 44093747254, composer 134090900643. Phone case timed out at 600,000ms after logging its email preview accessibility inspection. The owner case then timed out on a disabled Publish update.

The unchanged owner case passes alone (112,195ms, before-owner.log). Source inspection proves ResolutionStatuses is an informational warning with an optional Set to Automatic action; it does not enter publishBlockReason. No manual-status acknowledgement or additional choice is required. publishBlockReason checks wording, components, timestamps and saved draft authority.

The unchanged phone case is reproduced under a non-mutating Playwright diagnostic preload. It reaches the email preview inspection and stalls before any publication click (before-pair.log). The preview iframe newly uses sandbox="allow-same-origin", which prevents its script callbacks from running. A minimal isolated browser/Axe reproduction with the same sandbox times out; allow-same-origin plus allow-scripts completes. Testing an opaque allow-scripts sandbox preserves parent-document isolation while allowing the accessibility browser check to complete. See iframe-diagnostic.log.

No product or test source was edited for these baseline observations. Full reproduction and the exact displayed disabled reason remain pending.

Live inspection during the unchanged phone stall found Publish enabled (disabled=false), Draft saved, lifecycle Investigating and the exact submitted customer message. No publication-block reason existed. The page was waiting on Axe inside the script-disabled email iframe; this is not a deliberate owner gate. before-live-state.json records the actual browser state. The opaque allow-scripts sandbox also completes Axe and denies access to parent.document.

The paired baseline now reproduces the cascade: after the phone case times out, its still-pending accessibility task resumes on the next case's navigation. The diagnostic records an old Publish-update locator starting from /app/components, then the new owner helper sees "Publishing this update…" despite not having submitted its resolution. The timed-out phone task is acting on the shared page's later incident. This explains why the owner case passes alone but reports a disabled Publish after the phone failure. The repair must unblock the email iframe accessibility work, preserving isolation and the unchanged owner helper.

Completed before-edit pair: phone cancelled by its 600,000ms timeout; owner failed at helper line 66 after a 60,000ms disabled-button timeout. Its final displayed reason was "Describe what’s happening before publishing.", with "Not saved yet" and "Update published." in the cleared composer. The stale phone click had consumed the owner's resolution. No choice was missing. This is case (b): the product email preview's script-disabled sandbox causes the stalled check and cascading stale publication, so the helper remains unchanged.

Repair: permit iframe script callbacks in an opaque origin (sandbox=allow-scripts, without allow-same-origin). Its trusted sizing script reports only measured height; the parent accepts it only from that iframe's contentWindow and validates the numeric bound. The frame cannot access the authenticated parent document. Original customer-truth assertions are retained. The owner test adds an actual accessibility inspection, parent-isolation and foreign-message refusal checks followed by publishing a further immutable correction.

## Final proof-capture correction

The first broad run exposed a fault in the newly added optional screenshot capture, after the functional assertions had passed: waiting on requestAnimationFrame inside the phone iframe while it was below the viewport could remain suspended until the case timed out. The capture now scrolls the actual iframe into view before painting the full-page proof. This changes capture synchronization only; product behavior, the original helper and all assertions remain intact. The final owner case is rerun with proof enabled. The broad run also found the separate existing full-Chromium favicon budget failure described in review.md; a parent-revision comparison is recorded in parent-theme.log.
