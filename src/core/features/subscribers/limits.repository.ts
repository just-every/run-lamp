import { SubscriberLimitError, subscriberCapacity, subscriberChannelFull, subscriberLimitAlerts, type SubscriberChannel, type SubscriberCounts } from "./limits";

export function createSubscriberLimitRepository(db:D1Database) {
  async function counts():Promise<SubscriberCounts> {
    const row=await db.prepare(`SELECT COALESCE(SUM(total),0) AS total,
      COALESCE(SUM(total) FILTER (WHERE channel='email'),0) AS email,
      COALESCE(SUM(total) FILTER (WHERE channel='webhook'),0) AS webhook,
      COALESCE(SUM(total) FILTER (WHERE channel='slack'),0) AS slack,
      COALESCE(SUM(total) FILTER (WHERE channel='teams'),0) AS teams,
      COALESCE(SUM(total) FILTER (WHERE channel='sms'),0) AS sms
      FROM subscriber_limit_counts WHERE total > 0`).first<SubscriberCounts>();
    if(!row)throw new Error("Subscriber counts could not be read.");
    return row;
  }
  return {
    counts,
    async assertAvailable(channel:SubscriberChannel) {if(subscriberChannelFull(await counts(),channel))throw new SubscriberLimitError();},
    async report(){return subscriberCapacity(await counts());},
    async alerts(){return subscriberLimitAlerts(await counts());},
  };
}
export type SubscriberLimitRepository=ReturnType<typeof createSubscriberLimitRepository>;
