import { z } from "zod";
import { ulidSchema } from "../../shared/ids";
import { hasSafeWebhookDestination, normalizeEmail } from "./destination";
import { webhookFormatSchema, type WebhookFormat } from "./webhook-format";
import { preferencesSchema, type SubscriberPreferences } from "./preferences";
import type { SubscriberWriteAuthority } from "./incident-authority";

const preferences={eventKinds:preferencesSchema.shape.eventKinds.optional(),minimumImpact:preferencesSchema.shape.minimumImpact.optional()};
const componentIds=z.array(ulidSchema).max(200).default([]).transform(values=>[...new Set(values)]);
const smsAdd=z.object({channel:z.literal("sms"),phone:z.string().regex(/^\+[1-9]\d{7,14}$/u),componentIds,...preferences}).strict();
const emailAdd=z.object({channel:z.literal("email"),email:z.email().max(320).transform(normalizeEmail),componentIds,...preferences}).strict();
const webhookAdd=z.object({channel:z.literal("webhook"),destination:z.url().max(2048).refine(hasSafeWebhookDestination,"Use a public HTTPS webhook URL without credentials or a port."),contactEmail:z.email().max(320).transform(normalizeEmail),componentIds,webhookFormat:webhookFormatSchema.default("lamp"),...preferences}).strict();
export const subscriberAddSchema=z.discriminatedUnion("channel",[smsAdd,emailAdd,webhookAdd]);
export type SubscriberAddInput=z.infer<typeof subscriberAddSchema>;
/** API-001's token door creates email and webhook subscribers; SUB-013 owns phone intake. */
export const tokenSubscriberAddSchema=z.discriminatedUnion("channel",[emailAdd,webhookAdd]);
export type TokenSubscriberAddInput=z.infer<typeof tokenSubscriberAddSchema>;
/** A management token's identity and its live issuer fence, repeated inside the intake write. */
export interface IntakeToken {id:string;authority:SubscriberWriteAuthority}
export interface IntakeRow { row:number;channel:"email"|"webhook"|"sms";destination:string;contactEmail:string|null;componentIds:string[];webhookFormat?:WebhookFormat;eventKinds?:SubscriberPreferences["eventKinds"];minimumImpact?:SubscriberPreferences["minimumImpact"] }
export interface IntakeDecision {row:number;outcome:"created"|"skipped"|"refused";reason:string|null}
export interface IntakeCounts {created:number;skipped:number;refused:number}
export interface IntakePreview {fingerprint:string;counts:IntakeCounts;rows:IntakeDecision[];limits:string[]}
export interface IntakeApply {batchId:string;counts:IntakeCounts;subscriberIds:string[]}
export class SubscriberIntakeError extends Error {
  constructor(message:string,readonly status:400|401|403|409|413|503=400) {super(message);this.name="SubscriberIntakeError";}
}
