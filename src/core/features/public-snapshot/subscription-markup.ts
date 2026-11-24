import { groupComponentsByHeading } from "../../shared/component-order";
import { renderPreferenceFields } from "../subscribers/preferences";
import { emailSubscriptionsUnavailable } from "../subscribers/public-subscription-channels";
import { escapeHtml } from "./format";
import type { PublicSnapshotModel } from "./renderer";

// Native disclosures keep all subscription choices usable without script (PAGE-002).
export function subscriptionMarkup(model: PublicSnapshotModel, includeEmail = true) {
  if (model.prelaunch) return "";
  const channels = model.subscriptionChannels;
  const hasAlternatives = channels.sms || channels.slack || channels.teams;
  if (!includeEmail && !hasAlternatives) return "";
  const components = model.visibleComponents;
  const choices = groupComponentsByHeading(components).flatMap(([, values]) => values).map((component) => `<label><input type="checkbox" name="componentId" value="${escapeHtml(component.id)}"> ${escapeHtml(component.name)}</label>`).join("");
  const picker = choices ? `<details class="subscribe-components"><summary>Choose components</summary><fieldset><legend>Send me updates only about</legend><p>Leave every box clear to follow every component, including ones added later.</p>${choices}</fieldset></details>` : "";
  const preferences = `<details class="subscribe-components"><summary>Choose updates</summary>${renderPreferenceFields()}</details>`;
  const email = !includeEmail ? "" : channels.email ? `<form method="post" action="/subscribe"><label for="email">Email address</label><div class="subscribe-row"><input id="email" name="email" type="email" autocomplete="email" required><button type="submit">Subscribe</button></div>${picker}${preferences}</form>` : emailSubscriptionsUnavailable;
  const slack = channels.slack ? `<details class="subscribe-channel"><summary>Get updates in Slack</summary><form method="post" action="/subscribe/slack">${picker}${preferences}<button type="submit">Get updates in Slack</button></form></details>` : "";
  const sms = channels.sms ? `<details class="subscribe-channel"><summary>Get updates by SMS</summary><form method="post" action="/subscribe/sms"><label for="sms-phone">Mobile number</label><input id="sms-phone" name="phone" type="tel" autocomplete="tel" placeholder="+12025550100" required>${picker}${preferences}<button type="submit">Send opt-in text</button></form></details>` : "";
  const teams = channels.teams ? `<details class="subscribe-channel"><summary>Get updates in Teams</summary><form method="post" action="/subscribe/teams"><p><a href="/subscribe/teams/guide">Create a Teams Workflows webhook</a> before pasting its URL.</p><label for="teams-url">Teams Workflows webhook URL</label><input id="teams-url" name="url" type="url" autocomplete="off" required>${picker}${preferences}<button type="submit">Send verification card</button></form></details>` : "";
  const id = includeEmail ? "subscribe" : "subscribe-channels";
  const description = (channels.email && includeEmail) || hasAlternatives ? "<p>Choose how to receive future updates.</p>" : "";
  return `<section id="${id}" class="subscribe" aria-labelledby="${id}-title"><div class="subscribe-copy"><h2 id="${id}-title">Subscribe to status updates</h2>${description}</div><div class="subscribe-options">${email}${sms}${slack}${teams}</div></section>`;
}
