import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { eventuallySubscriber, openSubscriberManagementFixture, pageOrigin } from "./subscriber-management-fixture.mjs";
import { UPDATE_LINK_FIELDS } from "./update-component-flow.mjs";
import { assertLinkedSlackText } from "./update-link-evidence.mjs";

/** Extend the existing real Statuspage receiver journey, never fabricate bodies. */
export async function componentNotificationFlow({ fixture, component, subscriber, manageUrl, accepted, lampAccepted, slackAccepted, slackDestination, receiverErrors }) {
  const { api, post, raw } = fixture;
  const choose = async kinds => {
    const body = new URLSearchParams({ componentId: component.id, webhookFormat: "statuspage", preferencesPresent: "1" });
    for (const kind of kinds) body.append("eventKind", kind);
    const response = await raw(manageUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: new URL(manageUrl).origin }, body: body.toString() });
    assert.equal(response.status, 200, await response.text());
  };
  await choose(["components"]);
  assert.deepEqual((await fixture.list()).find(row => row.id === subscriber.id).preferences.eventKinds, ["components"], "the token-authorized management door saves component-only selection");
  const lampContact = "synthetic-lamp-components-contact@example.test";
  const lampAdded = await post("/api/app/subscribers", { channel: "webhook", destination: "https://receiver.example.test/synthetic-lamp-components", contactEmail: lampContact, componentIds: [component.id] });
  assert.equal(lampAdded.status, 201, lampAdded.text);
  await fixture.confirm(lampContact);
  assert.ok((await fixture.list()).find(row => row.id === lampAdded.body.subscriber.id).preferences.eventKinds.includes("components"), "webhook subscriptions select component changes by default");
  const lampManageUrl = fixture.messagesFor(lampContact)[0].text.match(/https?:\/\/\S+\/manage\/\S+/)?.[0];
  assert.ok(lampManageUrl);
  const slackAdded = await post("/api/app/subscribers/webhook", { destination: slackDestination, contactEmail: lampContact, componentIds: [component.id], eventKinds: ["incidents"] });
  assert.equal(slackAdded.status, 201, slackAdded.text);
  const componentBodies = () => accepted.filter(record => record.body.component_update);
  const lampComponentBodies = () => lampAccepted.filter(record => record.body.event === "component.changed");
  const flush = async (expected, expectedLamp) => {
    const response = await api("/api/app/overview/follow-ups");
    assert.equal(response.status, 200, response.text);
    for (const row of response.body.followUps.filter(row => row.kind === "notification-dispatch")) {
      const retry = await post("/api/app/overview/follow-ups/retry", { id: row.id, occurrence: row.occurrence });
      assert.equal(retry.status, 202, retry.text);
    }
    await eventuallySubscriber(() => {
      if (receiverErrors[0]) throw receiverErrors[0];
      return componentBodies();
    }, rows => rows.length === expected, "one strict receiver component_update is accepted for each committed public state change");
    await eventuallySubscriber(async () => (await api("/api/app/overview/follow-ups")).body.followUps,
      rows => !rows.some(row => row.kind === "notification-dispatch"), "all component deliveries finish through the real queue consumer");
    assert.equal(lampComponentBodies().length, expectedLamp, "Lamp format sends one component.changed per selected change and suppresses a duplicate incident carrier");
  };
  const count = accepted.length;
  const email = "synthetic-lamp-no-component-email@example.test";
  const emailAdded = await post("/api/app/subscribers", { channel: "email", email, componentIds: [component.id] });
  assert.equal(emailAdded.status, 201, emailAdded.text);
  await fixture.confirm(email);
  const beforeEmail = fixture.messagesFor(email).length;
  const claim = state => api(`/api/app/components/${component.id}/standing-claim`, { method: "PUT", body: JSON.stringify({ state }) });
  assert.equal((await claim("Degraded performance")).status, 200);
  await flush(1, 1);
  assert.equal(accepted.length, count + 1);
  assert.equal(fixture.messagesFor(email).length, beforeEmail, "an email subscriber without component changes selected receives nothing");
  const first = componentBodies()[0].body;
  assert.equal(first.component_update.old_status, "operational");
  assert.equal(first.component_update.new_status, "degraded_performance");
  assert.equal(first.component_update.claimant_kind, "standing-claim");
  const history = await api(`/api/app/components/${component.id}/history`);
  assert.equal(history.status, 200, history.text);
  const committed = history.body.history.find(row => row.newState === "Degraded performance" && row.causeType === "standing-claim");
  assert.ok(committed);
  assert.equal(first.component_update.created_at, committed.changedAt);
  assert.equal(JSON.stringify(first).includes("operatorId"), false, "component notifications carry no operator identity");
  assert.equal((await claim("Degraded performance")).status, 200);
  await flush(1, 1);
  assert.equal(fixture.messagesFor(email).length, beforeEmail);
  assert.equal((await api(`/api/app/subscribers/${emailAdded.body.subscriber.id}`, { method: "DELETE" })).status, 204);

  const internal = await fixture.createComponent("Synthetic Lamp internal no notification", true);
  assert.equal((await api(`/api/app/components/${internal.id}/standing-claim`, { method: "PUT", body: JSON.stringify({ state: "Major outage" }) })).status, 200);
  const correction = await post(`/api/app/components/${component.id}/history-corrections`, { state: "Operational", startsAt: new Date(Date.now() - 120_000).toISOString(), endsAt: new Date(Date.now() - 60_000).toISOString(), reason: "Synthetic historical correction" });
  assert.equal(correction.status, 204, correction.text);
  await flush(1, 1);
  const componentEmail = "synthetic-lamp-opted-component@example.test";
  const optedEmail = await post("/api/app/subscribers", { channel: "email", email: componentEmail, componentIds: [component.id], eventKinds: ["components"] });
  assert.equal(optedEmail.status,201,optedEmail.text);
  await fixture.confirm(componentEmail);
  const emailBeforeChange=fixture.messagesFor(componentEmail).length;
  assert.equal((await claim(null)).status, 200);
  await flush(2, 2);
  const emailDeliveries=async()=>{
    const response=await api("/api/app/deliveries?limit=100");assert.equal(response.status,200,response.text);
    return response.body.deliveries.filter(row=>row.subscriberId===optedEmail.body.subscriber.id);
  };
  const [emailDelivery]=await eventuallySubscriber(emailDeliveries,rows=>rows.length===1 && Boolean(rows[0].providerAcceptedAt),"an explicitly selected component email crosses the real mail adapter once");
  assert.equal(fixture.messagesFor(componentEmail).length,emailBeforeChange+1);
  assert.ok(fixture.messagesFor(componentEmail).at(-1).text.includes(component.name));
  const receipt=fixture.mailReceipts.find(row=>row.idempotencyKey===`notification/${emailDelivery.id}`);assert.ok(receipt);
  const receiptId=`synthetic-lamp-component-receipt-${emailDelivery.id}`,timestamp=String(Math.floor(Date.now()/1000));
  const receiptBody=JSON.stringify({type:"email.delivered",data:{email_id:receipt.id}});
  const signature=createHmac("sha256",Buffer.from("synthetic-lamp-subscriber-receipts")).update(`${receiptId}.${timestamp}.${receiptBody}`).digest("base64url");
  for(let replay=0;replay<2;replay++){
    const response=await raw(`${pageOrigin}/api/intake/mail-events`,{method:"POST",headers:{"Content-Type":"application/json","svix-id":receiptId,"svix-timestamp":timestamp,"svix-signature":`v1,${signature}`},body:receiptBody});
    assert.equal(response.status,200,"a signed component receipt and its replay retain the same delivery authority");
  }
  await eventuallySubscriber(emailDeliveries,rows=>rows.length===1 && rows[0].outcome==="delivered","the signed receipt reaches the component delivery's retained outcome");
  assert.equal((await fixture.db.prepare("SELECT COUNT(*) n FROM component_delivery_attempts WHERE delivery_id=?").bind(emailDelivery.id).first()).n,1,"receipt replay does not resend component mail");
  assert.deepEqual(await fixture.db.prepare("SELECT delivery_id,component_delivery_id FROM mail_provider_webhook_events WHERE provider_event_id=?").bind(receiptId).first(),{delivery_id:null,component_delivery_id:emailDelivery.id});
  assert.equal((await api(`/api/app/subscribers/${optedEmail.body.subscriber.id}`,{method:"DELETE"})).status,204);
  const erasedComponent=await fixture.db.prepare("SELECT outcome,mail_payload_json FROM component_notification_deliveries WHERE id=?").bind(emailDelivery.id).first();
  assert.equal(erasedComponent.outcome,"delivered");assert.ok(!erasedComponent.mail_payload_json.includes(componentEmail),"erasure scrubs the component partition's frozen recipient while retaining its outcome");

  // The component-only subscriber receives a separate transition on first
  // publication and resolution. Lamp's incident carrier includes every attachment.
  const unchanged = await fixture.createComponent("Synthetic Lamp unaffected attachment");
  const title = "Synthetic Lamp component-only incident";
  const created = await post("/api/app/incidents", { title, components: [
    { componentId: component.id, state: "Partially unavailable", relationship: "Primary" },
    { componentId: unchanged.id, state: "Operational", relationship: "Dependent" },
    { componentId: internal.id, state: "Degraded performance", relationship: "Dependent" },
  ] });
  assert.equal(created.status, 201, created.text);
  let incident = created.body.incident;
  const expectedUpdates = [];
  const publishedComponents = async state => {
    const response = await raw(`${pageOrigin}/api/public/v1/components`);
    assert.equal(response.status, 200);
    const { data } = await response.json();
    assert.equal(data.find(row => row.id === component.id)?.state, state);
    assert.equal(data.find(row => row.id === unchanged.id)?.state, "Operational");
    assert.ok(!data.some(row => row.id === internal.id), "the internal attachment stays outside the public catalogue");
  };
  const publish = async (lifecycle, componentTransition) => {
    const submitted = {
      ...(componentTransition
        ? Object.fromEntries(Object.entries(UPDATE_LINK_FIELDS).map(([field, text]) => [field, `${incident.reference} ${lifecycle}: ${text}`]))
        : { affectedAudience: "Synthetic customers", customerImpact: "See https://help.example.com/kb/123.", whatStillWorks: "", details: "Synthetic operator update" }),
      lifecycle,
      nextUpdateAt: lifecycle === "Resolved" ? null : new Date(Date.now() + 3_600_000).toISOString(),
    };
    const draft = await api(`/api/app/incidents/${incident.id}/draft`, { method: "PUT", body: JSON.stringify(submitted) });
    assert.equal(draft.status, 200, draft.text);
    const response = await post(`/api/app/incidents/${incident.id}/publish`, { channels: ["webhook"], ...(lifecycle === "Resolved" ? { overrideReason: "Synthetic operator verified recovery" } : {}) });
    assert.equal(response.status, 200, response.text);
    const deliveries = await eventuallySubscriber(async () => {
      if (receiverErrors[0]) throw receiverErrors[0];
      const deliveries = await api(`/api/app/deliveries?incidentUpdateId=${response.body.update.id}&limit=100`);
      assert.equal(deliveries.status, 200, deliveries.text);
      return deliveries.body.deliveries;
    }, rows => rows.every(row => row.outcome === "delivered"), "the incident's own after-publication dispatcher finishes before component dispatch is requested");
    if (componentTransition) {
      const delivery = deliveries.find(row => row.subscriberId === lampAdded.body.subscriber.id);
      assert.ok(delivery, "the selected Lamp subscriber has a delivery for this publication");
      const received = lampAccepted.find(record => record.deliveryId === delivery.id);
      assert.ok(received, "the signed receiver accepted this publication's own delivery");
      assert.equal(received.body.event, "incident.update.published");
      assert.equal(received.body.incident.reference, incident.reference);
      const update = received.body.updates.find(row => row.id === response.body.update.id);
      assert.ok(update, "the received update has the committed publication identity");
      for (const field of Object.keys(UPDATE_LINK_FIELDS)) {
        assert.equal(update[field], submitted[field], `Lamp ${field} preserves the submitted wording and bare URLs byte for byte`);
      }
      assert.equal(update.lifecycle, submitted.lifecycle, "Lamp preserves the submitted lifecycle");
      assert.equal(update.nextUpdateAt, submitted.nextUpdateAt, "Lamp preserves the submitted next-update commitment, including resolution's null");
      assert.equal(update.publishedAt, response.body.update.publishedAt);
      const [previousState, newState] = componentTransition;
      const changes = previousState === newState ? [] : [
        { componentId: component.id, name: component.name, previousState, newState, internal: false },
      ];
      expectedUpdates.push({
        id: response.body.update.id, ...submitted,
        publishedAt: response.body.update.publishedAt, componentChanges: changes,
      });
      const readback = await api(`/api/app/incidents/${incident.id}`);
      assert.equal(readback.status, 200, readback.text);
      const retained = readback.body.incident.updates;
      assert.deepEqual(retained.map(row => row.id).sort(), expectedUpdates.map(row => row.id).sort(),
        "the expected update inventory matches the native incident readback");
      assert.ok(retained.at(-1).componentChanges.some(change => change.componentId === internal.id),
        "the first retained update contains a real internal change to exclude");
      assert.ok(readback.body.incident.components.some(row => row.componentId === internal.id),
        "the internal component really is attached to this incident");
      const byId = (left, right) => left.id.localeCompare(right.id);
      assert.deepEqual({ ...received.body, components: [...received.body.components].sort(byId) }, {
        event: "incident.update.published",
        deliveryId: delivery.id,
        incident: { reference: incident.reference, title, impact: "major" },
        updates: expectedUpdates,
        components: [
          { id: component.id, name: component.name, previousState, newState },
          { id: unchanged.id, name: unchanged.name, previousState: "Operational", newState: "Operational" },
        ].sort(byId),
      }, "the event contains all retained wording and transitions, plus every public attachment including unchanged ones");
      for (const excluded of [internal.id, internal.name, lampContact]) {
        assert.ok(!received.wireBytes.includes(excluded), "the complete wire body excludes internal component identity and subscriber contact");
      }
      await publishedComponents(newState);
      const slackDelivery = deliveries.find(row => row.subscriberId === slackAdded.body.subscriber.id);
      assert.ok(slackDelivery, "the Slack incoming-webhook subscriber has this publication's delivery");
      const slack = slackAccepted.find(record => record.deliveryId === slackDelivery.id);
      assert.ok(slack, "the Slack receiver verified this publication's exact signed body");
      assertLinkedSlackText(slack.body.text, "Slack incoming webhook");
      const elements = slack.body.blocks.flatMap(block => block.elements.flatMap(section => section.elements));
      for (const field of Object.keys(UPDATE_LINK_FIELDS)) {
        assert.ok(elements.map(element => element.text).join("").includes(submitted[field]), `Slack rich text reassembles the original ${field}`);
      }
      assert.ok(elements.some(element => element.type === "link"), "bare HTTPS URLs are rich-text links");
      for (const link of elements.filter(element => element.type === "link")) {
        assert.equal(link.text, link.url, "every Slack link displays its own URL");
        assert.match(link.url, /^https:\/\//, "only HTTPS URLs become Slack links");
      }
    }
    return response.body.update;
  };
  await publishedComponents("Operational");
  await publish("Identified", ["Operational", "Partially unavailable"]); await flush(3, 2);
  await publish("Monitoring", ["Partially unavailable", "Partially unavailable"]); await flush(3, 2);
  await publish("Resolved", ["Partially unavailable", "Operational"]); await flush(4, 2);
  assert.equal((await api(`/api/app/subscribers/${slackAdded.body.subscriber.id}`, { method: "DELETE" })).status, 204);
  assert.equal(componentBodies()[2].body.component_update.old_status, "operational");
  assert.equal(componentBodies()[2].body.component_update.new_status, "partial_outage");
  assert.equal(componentBodies()[2].body.component_update.claimant_kind, "incident");
  assert.equal(componentBodies()[3].body.component_update.old_status, "partial_outage");
  assert.equal(componentBodies()[3].body.component_update.new_status, "operational");

  assert.equal(lampAccepted.filter(record => record.body.event === "incident.update.published").length, 3, "a Lamp subscriber selecting incidents receives the update without a duplicate component event");
  assert.deepEqual(lampComponentBodies()[0].body.component, { id: component.id, name: component.name, previousState: "Operational", state: "Degraded performance", changedAt: committed.changedAt, claimantKind: "standing-claim" });
  const lampPreferences = new URLSearchParams({ componentId: component.id, webhookFormat: "lamp", preferencesPresent: "1", eventKind: "components" });
  assert.equal((await raw(lampManageUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: new URL(lampManageUrl).origin }, body: lampPreferences.toString() })).status, 200);
  await choose(["incidents", "maintenance", "components"]);
  const maintenance = await post("/api/app/maintenance", { affectedAudience: "Customers using the scheduled service.", customerImpact: "Requests may be interrupted during this maintenance window.", title: "Synthetic Lamp component claimant", startsAt: new Date(Date.now() + 3_600_000).toISOString(), endsAt: new Date(Date.now() + 7_200_000).toISOString(), componentIds: [component.id], autoStart: false, autoComplete: false });
  assert.equal(maintenance.status, 201, maintenance.text);
  await flush(4, 2);
  assert.equal((await post(`/api/app/maintenance/${maintenance.body.maintenance.id}/start`)).status, 200);
  await flush(5, 3);
  assert.equal(componentBodies()[4].body.component_update.new_status, "under_maintenance");
  assert.equal(componentBodies()[4].body.component_update.claimant_kind, "maintenance");
  assert.equal((await post(`/api/app/maintenance/${maintenance.body.maintenance.id}/complete`)).status, 200);
  await flush(6, 4);
  assert.equal(componentBodies()[5].body.component_update.old_status, "under_maintenance");
  assert.equal(componentBodies()[5].body.component_update.new_status, "operational");
  // A Statuspage subscription explicitly keeping component events gets one
  // component_update beside the incident; a component-only Lamp subscription
  // gets exactly that change and none of the incident updates.
  const second = await post("/api/app/incidents", { title: "Synthetic Lamp opted-in component incident", components: [{ componentId: component.id, state: "Partially unavailable", relationship: "Primary" }] });
  assert.equal(second.status, 201, second.text);
  incident = second.body.incident;
  const beforeIncidentCarriers = accepted.filter(record => record.body.incident).length;
  await publish("Identified"); await flush(7, 5);
  await publish("Monitoring"); await flush(7, 5);
  await publish("Resolved"); await flush(8, 6);
  assert.equal(accepted.filter(record => record.body.incident).length, beforeIncidentCarriers + 3);
  assert.equal(lampAccepted.filter(record => record.body.event === "incident.update.published").length, 3, "component-only selection does not receive incident updates");
  const anchor = await fixture.createComponent("Synthetic Lamp attachment anchor");
  const attaching = await post("/api/app/incidents", { title: "Synthetic Lamp live attachment claimant", components: [{ componentId: anchor.id, state: "Major outage", relationship: "Primary" }] });
  assert.equal(attaching.status, 201, attaching.text);
  incident = attaching.body.incident;
  await publish("Identified"); await flush(8, 6);
  const attached = await post(`/api/app/incidents/${incident.id}/components`, { componentId: component.id, state: "Major outage", relationship: "Primary" });
  assert.equal(attached.status, 201, attached.text);
  await flush(9, 7);
  assert.equal(componentBodies().at(-1).body.component_update.old_status, "operational");
  assert.equal(componentBodies().at(-1).body.component_update.new_status, "major_outage");
  const detached = await api(`/api/app/incidents/${incident.id}/components/${component.id}`, { method: "DELETE" });
  assert.equal(detached.status, 200, detached.text);
  await flush(10, 8);
  assert.equal(componentBodies().at(-1).body.component_update.old_status, "major_outage");
  assert.equal(componentBodies().at(-1).body.component_update.new_status, "operational");
  assert.equal((await fixture.list()).find(row => row.id === subscriber.id).state, "active");
}

/** Exercise internal silence with an independently verified, eligible webhook. */
export async function internalStandingClaimSilenceFlow() {
  const signingKey = "synthetic-lamp-internal-claim".repeat(4);
  const fixture = await openSubscriberManagementFixture({
    workerEntry: "tests/e2e/helpers/status-journey.worker.ts",
    extraBindings: { WEBHOOK_SIGNING_SECRET: signingKey },
  });
  const { api, db, post, raw, webhookRequests } = fixture;
  try {
    fixture.recoverWebhook();
    const visible = await fixture.createComponent("Synthetic Lamp visible service");
    const internal = await fixture.createComponent("Synthetic Lamp private service", true);
    assert.equal(visible.internal, false);
    assert.equal(internal.internal, true);

    const contact = ["synthetic-lamp-internal-claim", "example.test"].join("@");
    const destination = "https://receiver.example.test/synthetic-lamp-components";
    const added = await post("/api/app/subscribers", {
      channel: "webhook", destination, contactEmail: contact, componentIds: [], webhookFormat: "lamp", eventKinds: ["components"],
    });
    assert.equal(added.status, 201, added.text);
    assert.equal(added.body.subscriber.state, "pending");
    const subscriberId = added.body.subscriber.id;
    await fixture.confirm(contact);
    const [choice] = await fixture.list();
    assert.deepEqual({
      id: choice.id, destination: choice.destination, channel: choice.channel, state: choice.state,
      mode: choice.selectionMode, selections: choice.componentSelections, kinds: choice.preferences.eventKinds,
    }, {
      id: subscriberId, destination, channel: "webhook", state: "active",
      mode: "all", selections: [], kinds: ["components"],
    });

    const session = await api("/api/app/session");
    assert.equal(session.status, 200, session.text);
    const operatorId = session.body.operator.id;
    assert.ok(operatorId);
    const history = async component => {
      const result = await api(`/api/app/components/${component.id}/history`);
      assert.equal(result.status, 200, result.text);
      assert.equal(result.body.historyPage.nextCursor, null);
      return result.body.history;
    };
    const commitClaim = async (component, state) => {
      const before = await history(component);
      assert.deepEqual(before.map(row => row.newState), ["Operational"]);
      const started = Date.now();
      const changed = await api(`/api/app/components/${component.id}/standing-claim`, {
        method: "PUT", body: JSON.stringify({ state }),
      });
      const finished = Date.now();
      assert.equal(changed.status, 200, changed.text);
      assert.equal(changed.body.component.id, component.id);
      assert.equal(changed.body.component.standingClaimState, state);
      assert.equal(changed.body.component.publicState, state);
      const after = await history(component);
      assert.deepEqual(after.filter(row => row.id === before[0].id), before);
      const appended = after.filter(row => row.id !== before[0].id);
      assert.equal(appended.length, 1, "the standing claim appends exactly one native history transition");
      const [transition] = appended;
      assert.ok(transition.id);
      const changedAt = Date.parse(transition.changedAt);
      assert.ok(changedAt >= started && changedAt <= finished, "the transition instant belongs to this claim request");
      assert.deepEqual(transition, {
        id: transition.id, previousState: "Operational", newState: state, causeType: "standing-claim",
        causeId: null, operatorId, changedAt: new Date(changedAt).toISOString(), createdAt: transition.changedAt,
        sourceName: null, sourceUrl: null,
      });
      return transition;
    };

    const rows = async sql => (await db.prepare(sql).all()).results;
    const inventory = async () => ({
      events: await rows("SELECT * FROM component_notification_events ORDER BY id"),
      deliveries: await rows("SELECT id, subscriber_id, channel, notification_event_id, component_event_id, outcome FROM notification_delivery_records ORDER BY id"),
      outbox: await rows("SELECT * FROM notification_outbox ORDER BY id"),
      receiver: webhookRequests.map(({ rawBody, headers }) => ({ rawBody, headers })),
    });
    const tick = async () => {
      const worker = await fixture.runtime.getWorker();
      assert.equal((await worker.scheduled({ cron: "* * * * *" })).outcome, "ok");
    };
    const pauseEffects = async paused => {
      const result = await raw("/test/effects", { method: "PUT", body: JSON.stringify({ paused }) });
      assert.equal(result.status, 204);
    };

    assert.deepEqual(await inventory(), { events: [], deliveries: [], outbox: [], receiver: [] });
    const visibleTransition = await commitClaim(visible, "Degraded performance");
    await tick();
    const control = await eventuallySubscriber(inventory, result =>
      result.deliveries.some(row => row.outcome === "delivered") &&
      result.outbox.some(row => row.completed_at !== null), "ordinary dispatch completes the visible control");
    assert.deepEqual(control.events, [{
      id: visibleTransition.id, component_id: visible.id, component_name: visible.name,
      component_created_at: visible.createdAt, previous_state: "Operational", new_state: "Degraded performance",
      changed_at: visibleTransition.changedAt, claimant_kind: "standing-claim",
    }]);
    assert.equal(control.deliveries.length, 1);
    const [{ id: deliveryId }] = control.deliveries;
    assert.ok(deliveryId);
    assert.deepEqual(control.deliveries, [{
      id: deliveryId, subscriber_id: subscriberId, channel: "webhook",
      notification_event_id: visibleTransition.id, component_event_id: visibleTransition.id, outcome: "delivered",
    }]);
    assert.equal(control.outbox.length, 1);
    const [command] = control.outbox;
    assert.equal(command.kind, "delivery-dispatch");
    assert.equal(command.aggregate_id, visibleTransition.id);
    assert.deepEqual(JSON.parse(command.payload_json), { eventId: visibleTransition.id, eventType: "component-change" });
    assert.ok(command.completed_at);
    assert.equal(control.receiver.length, 1);
    const [received] = webhookRequests;
    assert.equal(received.headers["webhook-id"], deliveryId);
    const timestamp = received.headers["webhook-timestamp"];
    assert.match(timestamp ?? "", /^\d+$/);
    const signature = createHmac("sha256", signingKey)
      .update(`${deliveryId}.${timestamp}.`).update(received.wireBytes).digest("base64url");
    assert.equal(received.headers["webhook-signature"], `v1=${signature}`);
    assert.deepEqual(received.body, {
      event: "component.changed", deliveryId, component: {
        id: visible.id, name: visible.name, previousState: "Operational", state: "Degraded performance",
        changedAt: visibleTransition.changedAt, claimantKind: "standing-claim",
      },
    });

    await pauseEffects(true);
    await commitClaim(internal, "Major outage");
    assert.deepEqual(await inventory(), control, "the committed internal transition creates no event, delivery, outbox entry or receiver request");
    await pauseEffects(false);
    await tick();
    assert.deepEqual(await inventory(), control, "ordinary dispatch leaves the internal transition silent at every layer");
  } finally {
    await fixture.close();
  }
}
