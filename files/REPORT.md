# Lamp operator invitations and local accent colour

Run Edit Run fleet · 17 November 2026 UTC · sd-lamp-design-invite-1

## Plan and approach

1. Start on Lamp main and run non-interactive local setup with a distinctive accent. Complete the first-run card without importing a website. Read the stored colour and open Settings → Look. Invite a colleague from Settings → Operators and inspect the pending row at 1440 and 390 pixels.
2. Trace the actual delivery receipt and the sign-in mechanism before changing owner copy. Keep the local sign-in gate and role selection. Use the sign-in addresses returned by Lamp’s existing account service, including on a later visit to the pending list.
3. Move the accent into ordinary page setup and pass the validated answer to the existing page initializer. Preserve the local command’s original fallback and the branding on an existing installation. Extend the existing owner journey to cover setup and sign-in through the browser.
4. Repeat the two walks on a fresh installation. Check the copied address by opening it and reading the resulting operator session. Run the affected journey, typecheck, regenerate and check the source lock, and verify the pushed candidate.

## Observations

The baseline was `c26d13c6df113fb79ac4b9d1480f15c16a06be51`. On both widths the owner supplied `#48724e`, but the stored settings and Look showed `#2563EB`. Creating an invitation returned success and showed the colleague in the pending list. There was no copy action in either row.

On the candidate, the stored setting, colour field and swatch agreed on `#48724E` at both widths. The owner did not need to re-enter it. Both invitation rows had a copy action. Opening the clipboard address from the authorized local browser signed in as the specific invitee. Neither screen overflowed horizontally. The browser JSON files and eight screenshots record these walks.

## Invitation wording

The native account service issues a one-click address only when local access is available. It checks the local browser’s admission and the pending invitation. Lamp exposes eligible links to the owner and directs them to open the link in that browser. The development mail sender suppresses delivery and retains no message. In the online path, accepting an email at a configured sender lets Lamp tell the owner to ask the colleague to open it. Putting a copy online does not send old local invitations, so the instruction is to invite the colleague from the online copy with email enabled. The deploy link goes to Lamp’s existing owner guide.

The installer uses the same page settings record as Settings → Look. A completed installation keeps its existing branding when setup is repeated. The fresh-install proof used non-interactive setup and the real first-run and Settings screens. The hosted mail journey uses a test sender at the transport boundary.

## Checks and scope

The product branch is `cloud/sd-lamp-design-invite-1` at `52b8cf9a9fea49553adb7e18a3877c76c8122d00`. A Git ref read confirmed the pushed head. A fresh local installation on the final source tree repeated setup and the two-width browser proof. A separate repeat-setup run requested `#863d20`, retained the saved `#48724E`, and displayed the instruction to change it in Settings → Look.

The build, typecheck, focused native setup and operator management journey, contract document check, and regenerated source-lock check passed. The touched test file contains one registered journey before and after. The focused run passed one test, with zero failures or skips. It verified both the stored setup value before first-run editing and the colour shown later in Look. It also exercised invitation cancellation, real clipboard use and the invitee’s resulting role. Both product commits have the fleet author and committer and no trailers. The fleet owns the publication scan and landing.

No contract clause claimed; these are owner-journey design fixes (DIRECT 87).

The contract stayed at 60 done, 129 partial and 55 missing out of 244 clauses.

## CI repair

The first Verify, run 44161343617 on `cc96176d7f05f8e026c569d31f97db25e6ec6f08`, failed the composer shard. An existing invitation test exercises local mail suppression with one-click sign-in turned off and expected the confirmation to identify this computer. The final commit restores that sentence and adds the copy-link instruction only when the invitation service returns a link. The original assertion passed locally, as did the extended native journey, build, typecheck and source-lock check. See `first-verify.json` for the failing job and `verify.json` for the final candidate.

Final Verify run 44166174802 completed successfully on the exact pushed head. [GitHub Actions](https://github.com/just-every/run-lamp/actions/runs/44166174802)
