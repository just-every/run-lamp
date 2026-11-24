export type PublicSubscriptionChannels = {
  email: boolean;
  sms: boolean;
  webhook: boolean;
  slack: boolean;
  teams: boolean;
};

export const noPublicSubscriptionChannels: PublicSubscriptionChannels = {
  email: false, sms: false, webhook: false, slack: false, teams: false,
};

export const emailSubscriptionsUnavailable = "<p>Email subscriptions are unavailable for this installation.</p>";
