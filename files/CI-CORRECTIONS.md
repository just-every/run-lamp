# Exact-SHA Verify follow-up
Author: Run Edit Run fleet
Date: 2026-11-17 UTC

Verify 44090059079 failed on 6b459467fc17e8dd6d72b481b1356fe6db6ad10f.
Build, ownership, imports, demo, delivery and portability succeeded. Public,
runtime and composer failed; their aggregate consequently failed. The four
failed jobs were read once each with gh run view --log-failed.

The failed assertions all depended on implicitly granting Owner to an invitee:
- subscriber intake/erasure attribution tried to create components as the invited actor;
- reviewed publication tried to change settings as its invited author;
- maintenance attribution tried to invite its next actor;
- uptime correction tried to create components as its invited creator;
- the replacement Communicator tried to read the administration audit view.

The attribution fixture now explicitly requests Admin, and the audit-reading
publication reviewer is explicitly invited as Admin. The reminder flow keeps
its replacement Communicator, reads the audit as the original owner, then
restores the replacement's session to publish the resolution. Every original
assertion is retained. No product permission is widened and no default is
changed back to Owner.

The ten-call GitHub budget is exhausted: PR creation, four run discovery/status
calls, job discovery, and one failed-log invocation for each of the four failed
jobs. The corrected candidate will be pushed after local checks; its new Verify
result cannot be observed in this task. It must not be reported READY.
