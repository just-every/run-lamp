# Lamp setup design replay

No contract clause claimed; these are owner-journey design fixes (DIRECT 87).

## Plan and replay

1. Verify both published source heads. Re-apply the two linear commits from cloud/sd-lamp-design-setup-2-c1 on the latest Lamp main. Preserve the newer Settings, invitation, incident and maintenance behavior where the changes overlap.
2. Apply the PAGE-012 favicon ruling and restore the main-branch logo-only favicon and Open Graph assertion. Check the separately uploaded square icon with different image bytes, so the test can distinguish it from the logo. Update the component History drawer assertion to follow the Brisbane time-zone link to its Settings control.
3. Re-record the single Base adaptation for src/base/lobby.ts with the edition-authoring command. Generate and check the contract views, restore both from main, then regenerate and check the source lock.
4. Run the full ordered build, the touched owner and public journeys, and the publication scan. Capture the changed screens at 1440 px and 390 px.
5. Publish the linear product candidate to the named cloud branch, verify that precise SHA, then publish this packet to the evidence branch.

## Product scope

- D4 and D7 cover the owner’s setup questions, the page name and the Settings Page time zone. Maintenance and incident time fields use the configured zone with a link back to Settings. Incident and maintenance changes already on main were preserved.
- D9 covers separate logo and square-icon uploads and use of the page name across the operator header, tab and native sign-in. PAGE-012 still uses the configured logo with the current state mark when there is only a logo. A square icon takes precedence in the favicon, with the state mark retained. The default is a letter with the state mark. The Open Graph image keeps the logo and overall status.
- D17 covers the local restart and sign-in guidance, including the README and first-run instructions.
- Settings retains main’s invitation layout and accent-colour validation. Tests exercise retaining the last saved accent when the next value is invalid, and recovery through both the text field and picker.
- The original Base comparison revision is f2737d02a5f77be042cfdfd237a7dce4689cbe2f. The lobby adaptation acknowledges mode 100644 and SHA-256 90187c5f448e14ac40ce08d24fd0cd0dc86b8f4af4133122bc18b2fd6e392858. The comparison baseline remains unchanged.

## Contract counts

| Scope | Before done / partial / missing | After done / partial / missing | Total |
| ---- | ---- | ---- | ---- |
| Core | 60 / 129 / 50 | 60 / 129 / 50 | 239 |
| Agent surface | 0 / 0 / 5 | 0 / 0 / 5 | 5 |
| Later | 0 / 0 / 0 | 0 / 0 / 0 | 0 |
| Full target | 60 / 129 / 55 | 60 / 129 / 55 | 244 |
| Homepage claims | 1 / 23 / 0 | 1 / 23 / 0 | 24 |

PAGE-012 remains partial. CONTRACT.md, both generated contract views and RELEASE.json match main. The contract generator wrote zero documents and reported zero prose errors and warnings.

## Source and publication

- Initially checked out main d67ebd9edde4f39afd80fed797b3364f944894b5. Re-applied c383a5263a73d61d5faf40a076f41d0a976cd983 and 8863365f299cc5202384df08e4bd0b49e2ef1531 from the verified source branch. The original design branch matched aab0f2e95fae28ff7c968ace7321f26a85664991.
- Main advanced to 284b2b75541f298d96dae6b3703f63be17cff4ae before publication. Re-applied both commits there. The added automatic maintenance and notification guidance and its assertions came from main. The source lock was the only conflict in this second replay.
- Final linear commits are 4879d4d86a6dd074bcb5d0a6cbc8d1c16b291f9d and ecd9b50c6af3b65bb68b231d942d6a5f51aeb43c. Both use fleet author and committer identity. No commit trailers or merge commits were present. The product branch was pushed once at 2026-11-18T03:07:49Z. The lane has custody of landing.
- The final candidate Gitleaks scan, git diff whitespace check and generated source checks passed. The source lock was regenerated after restoring the contract views on both commits. The fleet publication gate runs independently at landing.

## Local verification

- The exact final SHA passed all nine ordered build steps with Node 22.20.0 and pnpm 10.12.4. The recorded steps are contract docs, Base copies, source lock, typecheck, syntax, release validation, visual source, app build and site build.
- The initial replay passed the complete public catalogue journey, the maintenance time-zone and keyboard journey, the website onboarding and branded sign-in journey, the native setup and invitation journey, and both Settings preservation tests. The final replay retained those product changes and incorporated main's newer maintenance and notification guidance.
- An exact final SHA proof over the public HTTP routes checked a letter plus state when no artwork is configured, the logo plus state with main's existing composition for logo-only owners, and the separate icon plus updated state after icon upload. The Open Graph image and title still carried overall status and the logo remained the image artwork.
- The browser directory contains one desktop and one mobile capture per listed screen. The additional component History, incident and public maintenance captures use the existing setup screenshot helper and the maintenance journey, with screenshot calls loaded locally. The test assertions are the same as the committed journey.
- The exact final SHA passed four more browser journeys after the latest main replay. They cover maintenance scheduling, time-zone navigation, historical correction and keyboard subscription, local subscriber notifications, suppressed invitation mail, and website onboarding through branded sign-in. All sixteen screenshots were recorded on that SHA.
- The full local publication scan passed the initial replay with 1,184 commits inspected and zero new findings. The final candidate scan checked both unpublished commits with the pinned publication policy and found zero leaks. The release lander runs its own scan.

## Exact-SHA Verify

2026-11-18T03:18:34Z — Verify 44228207380 was in_progress for ecd9b50c6af3b65bb68b231d942d6a5f51aeb43c.
