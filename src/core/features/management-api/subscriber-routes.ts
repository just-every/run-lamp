import { bodyLimit } from "hono/body-limit";
import type { Hono } from "hono";
import type { AppEnv } from "../../app/types";
import { notificationOrigin } from "../../app/mail";
import type { PublicWriteRateLimiter } from "../../platform/security/rate-limiter";
import { subscriberIntakeFailure } from "../subscribers/intake-routes";
import { tokenSubscriberAddSchema, type IntakeToken, type TokenSubscriberAddInput } from "../subscribers/intake-schema";
import type { SubscriberView } from "../subscribers/service";
import { tokenFence } from "./repository";
import type { ManagementApiService } from "./service";

export interface SubscriberCreateApiService {
  create(input:TokenSubscriberAddInput,operatorId:string,origin:string,token:IntakeToken):Promise<{subscriber:SubscriberView;created:boolean;confirmationSent:boolean}>;
}

/** The stored record this token just created. */
function createdView(view:SubscriberView) {
  return {
    id:view.id,channel:view.channel,destination:view.destination,contactEmail:view.contactEmail,state:view.state,selectionMode:view.selectionMode,
    componentIds:view.componentSelections.map(row=>row.componentId).sort(),webhookFormat:view.webhookFormat,addedBy:view.addedBy,createdAt:view.createdAt,
  };
}

/** API-001 subscriber create runs the native Add subscriber intake as the token's
 * issuer: one confirmation, pending until it is confirmed, audited with the token.
 * An existing destination's details stay private to subscriber readers. */
export function registerSubscriberApiRoutes(app:Hono<AppEnv>,management:ManagementApiService,subscribers:SubscriberCreateApiService,limiter:PublicWriteRateLimiter) {
  app.post("/api/v1/subscribers",bodyLimit({maxSize:16_384,onError:c=>c.json({error:"Subscriber input is too large."},413)}),async c=>{
    c.header("Cache-Control","no-store");
    const authenticated=await management.authenticate(c.req.raw);
    if(!authenticated)return c.json({error:"A valid management token is required."},401);
    if(!authenticated.token.scopes.includes("subscribers:write"))return c.json({error:"The subscribers:write scope is required."},403);
    if(!await limiter.allow({scope:"management-token",subject:authenticated.authority.id,limit:60})) {
      c.header("Retry-After",String(60-Math.floor(Date.now()/1000)%60));
      return c.json({error:"This token's minute request limit was reached."},429);
    }
    const input=tokenSubscriberAddSchema.safeParse(await c.req.json().catch(()=>null));
    if(!input.success)return c.json({error:"Supply an email address, or a public HTTPS webhook URL with its contact email, and visible component IDs."},400);
    if(c.env.EFFECTS_PAUSED==="1")return c.json({error:"Outbound effects are paused."},409);
    const {authority}=authenticated;
    try {
      const result=await subscribers.create(input.data,authority.personId,await notificationOrigin(c.env),{id:authority.id,authority:tokenFence(authority,"subscribers:write")});
      if(!await management.recordRead(authority,"subscribers:write"))return c.json({error:"A valid management token is required."},401);
      return result.created
        ? c.json({subscriberId:result.subscriber.id,created:true,confirmationSent:result.confirmationSent,subscriber:createdView(result.subscriber)},201)
        : c.json({subscriberId:result.subscriber.id,created:false,confirmationSent:false,subscriber:null},200);
    } catch(cause) {return subscriberIntakeFailure(c,cause);}
  });
}
