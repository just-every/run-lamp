# Diagnosis

Author: Run Edit Run fleet. Date: 2026-11-17 UTC.

Starting product: 92aa684cf150afdc9472a238fb08ed5cfdfb61de.

Verify 44093747254 failed its composer shard. Its phone journey stopped during accessibility inspection of the new email preview and reached the 600-second test timeout. The later owner communication journey then found its publication button disabled. The original focused owner communication journey passes by itself on the saved head, including manual degradation, resolution email, correction persistence, retained history, public correction links and returning the component to Automatic.

A separate minimal Chromium probe reproduces the inspection hang with a script-disabled same-origin iframe. The default Axe Playwright runner recursively inspects frames and waits for frame messaging. Passing `iframes: false` alone still enters its recursive frame runner. Running the outer document through Axe's supported legacy entrypoint with `iframes: false` finishes; it retains checks on the containing iframe itself. The email's exact srcdoc is inspected separately at the iframe's actual width with the same WCAG tags and severity assertions. The product's sandbox remains intact.

The continuation changes the phone journey's accessibility helper only. No product behavior or user-visible flow assertion is removed. No test registrations, timeout increases, skips, new snapshot expectations, workflow changes or copy pin tests are added. Other browser tests continue using their existing assertion paths.

Baseline local phone probe: reached sign-in, alerts, composer and email preview, then stopped responding in accessibility analysis. It was terminated using only its recorded process tree after the independently reproduced hang; it is not reported as a completed test run. The baseline focused owner journey passed (one test).
