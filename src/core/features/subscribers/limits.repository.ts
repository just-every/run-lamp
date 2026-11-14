import { SubscriberLimitError, subscriberCapacity, subscriberChannelFull, subscriberLimitAlerts, type SubscriberChannel, type SubscriberCounts } from "./limits";

export function createSubscriberLimitRepository(db:D1Database) {
  async function counts():Promise<SubscriberCounts> {
    const row=await db.prepare(`SELECT SUM(total) AS total,
      SUM(CASE WHEN channel='email' THEN total ELSE 0 END) AS email,SUM(CASE WHEN channel='webhook' THEN total ELSE 0 END) AS webhook,
      SUM(CASE WHEN channel='slack' THEN total ELSE 0 END) AS slack,SUM(CASE WHEN channel='teams' THEN total ELSE 0 END) AS teams,SUM(CASE WHEN channel='sms' THEN total ELSE 0 END) AS sms
      FROM subscriber_limit_counts`).first<SubscriberCounts>();
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
