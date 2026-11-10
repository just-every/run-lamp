/** What a pre-launch page tells search engines. Present as a snapshot artifact only while pre-launch is on. */
export const PRELAUNCH_ROBOTS_KEY = "robots.txt";
export const PRELAUNCH_ROBOTS_TXT = "User-agent: *\nDisallow: /\n";
export const PRELAUNCH_ROBOTS_TAG = "noindex, nofollow";

/** Public routes that create a subscriber or send a confirmation or opt-in message. */
export const PRELAUNCH_BLOCKED_POSTS = ["/subscribe", "/subscribe/incident", "/subscribe/teams", "/subscribe/sms", "/subscribe/slack"] as const;
// The Slack OAuth return is the step that creates the subscriber.
export const PRELAUNCH_BLOCKED_GETS = ["/subscribe/slack/callback"] as const;
