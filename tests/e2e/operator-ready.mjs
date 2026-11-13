// Operator data can arrive in the document before its event handlers. The
// shared account button stays disabled until React has hydrated the workspace.
export async function waitForOperatorReady(page) {
  await page.getByRole("button", { name: "Sign out", exact: true }).and(page.locator(":enabled")).waitFor();
}

export async function openOperatorPage(page, url) {
  await page.goto(url);
  await waitForOperatorReady(page);
}
