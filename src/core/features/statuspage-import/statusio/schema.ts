import { z } from "zod";

export const statusIoId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/u);
const name = z.string().trim().min(1).max(20_000);
const time = z.iso.datetime({ offset: true });
const position = z.number().int().optional();
const ref = z.object({ _id: statusIoId, statuspage: statusIoId.optional() });

export const containerSchema = z.object({ _id: statusIoId, name, position });
export const componentSchema = z.object({
  _id: statusIoId, name, position, statuspage: statusIoId,
  containers: z.array(containerSchema),
});

const message = z.object({
  _id: statusIoId, datetime: time, details: z.string(),
  components: z.array(statusIoId).optional(), containers: z.array(statusIoId).optional(),
  statuspage: statusIoId.optional(), incident: statusIoId.optional(), maintenance: statusIoId.optional(),
});

const event = z.object({
  _id: statusIoId, name, statuspage: statusIoId, datetime_open: time,
  components_affected: z.array(ref).optional(), containers_affected: z.array(ref).optional(),
  infrastructure_affected: z.array(z.object({ component: ref, container: ref })),
}).partial({ infrastructure_affected: true });

export const incidentStates = { 100: "investigating", 200: "identified", 300: "monitoring", 400: "resolved" } as const;
export const maintenanceStates = { 100: "scheduled", 200: "in_progress", 300: "completed" } as const;
export const componentStates = { 100: "operational", 200: "under_maintenance", 300: "degraded_performance", 400: "partial_outage", 500: "major_outage", 600: "major_outage" } as const;

export const incidentSchema = event.extend({
  datetime_close: time.nullish(), datetime_resolve: time.nullish(),
  messages: z.array(message.extend({ state: z.literal([100, 200, 300, 400]), status: z.literal([100, 200, 300, 400, 500, 600]) })),
});
export const maintenanceSchema = event.extend({
  datetime_planned_start: time.nullish(), datetime_planned_end: time.nullish(),
  messages: z.array(message.extend({ state: z.literal([100, 200, 300]), status: z.literal([100, 200, 300, 400, 500, 600]).optional() })),
});

export const envelopeSchema = z.object({ status: z.object({ error: z.literal("no"), message: z.string() }), result: z.unknown() });
export type StatusIoComponent = z.infer<typeof componentSchema>;
export type StatusIoIncident = z.infer<typeof incidentSchema>;
export type StatusIoMaintenance = z.infer<typeof maintenanceSchema>;
