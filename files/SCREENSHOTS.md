# Browser captures

All application screens came from the candidate's built static run site, served
locally with the repository's sitePreview. Chromium was /usr/bin/chromium,
headless with --no-sandbox, and each context was closed. No owner sessions or
private data appear in these images.

| Files | What is shown |
| --- | --- |
| 1440-run.png / 390-run.png | Run page with existing Other ways details expanded: curl lead, npx alternative, actual Bash PATH line and local guide link. |
| 1440-run-locally.png / 390-run-locally.png | Repository Markdown rendered through the public documentation route; launch and PATH blocks precede the first bare rer command. |
| 1440-deploy.png / 390-deploy.png | Full deployment guide, including PATH setup before its commands. |
| 1440-deploy-step-7.png / 390-deploy-step-7.png | Viewport at step 7: stop the development server before the dry run. |
| 1440-readme-preview.png / 390-readme-preview.png | Local Markdown preview of changed README sections; README has no app route. This is a review preview, not a screenshot of GitHub's renderer. |

browser-receipt.json records HTTP 200 and document-width measurements for the
actual routes. Long commands retain the site's existing code wrapping or
horizontal scrolling; no global document overflow occurred at either width.
