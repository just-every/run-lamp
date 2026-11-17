import { z } from "zod";
import { COMPONENT_STATES, INCIDENT_LIFECYCLES } from "../../shared/domain";
import { ulidSchema } from "../../shared/ids";

export const templateChannelsSchema = z.array(z.enum(["email", "webhook", "chat", "sms", "social"])).max(5).refine(channels => new Set(channels).size === channels.length, "Select each channel once.");
export const templateResolvedUpdateSchema = z.object({
  affectedAudience: z.string().trim().min(1).max(250), customerImpact: z.string().trim().min(1).max(250),
  whatStillWorks: z.string().max(250), details: z.string().max(500),
}).strict();

const templateComponents = z.array(z.object({
  componentId: ulidSchema,
  state: z.enum(COMPONENT_STATES),
  relationship: z.enum(["Primary", "Dependent"]).default("Primary"),
}).strict()).min(1).max(100).refine(components => new Set(components.map(component => component.componentId)).size === components.length, "A component may appear only once.");

export const templateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  lifecycle: z.enum(INCIDENT_LIFECYCLES),
  affectedAudience: z.string().trim().min(1).max(250),
  customerImpact: z.string().trim().min(1).max(250),
  whatStillWorks: z.string().max(250),
  details: z.string().max(500),
  nextUpdateOffsetMinutes: z.number().int().min(1).max(10_080),
  components: templateComponents,
  channels: templateChannelsSchema.optional(),
  resolvedUpdate: templateResolvedUpdateSchema.nullable().optional(),
}).strict();

export const templateUpdateSchema = templateSchema.extend({
  // Imported wording can be edited before the owner supplies draft-only defaults.
  // Native templates still receive the complete-template validation in service.
  affectedAudience: z.string().max(250),
  customerImpact: z.string().max(250),
  nextUpdateOffsetMinutes: z.number().int().min(1).max(10_080).nullable(),
  title: z.string().max(250),
  folder: z.string().max(250),
  shouldSendNotifications: z.boolean().nullable(),
}).partial().strict().refine(input => Object.keys(input).length > 0, "Choose a template field to edit.");

export type IncidentTemplateInput = z.infer<typeof templateSchema>;
export type IncidentTemplateEdit = z.infer<typeof templateUpdateSchema>;
