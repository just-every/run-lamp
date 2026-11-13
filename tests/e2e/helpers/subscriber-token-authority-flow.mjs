import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { openSubscriberManagementFixture, pageOrigin } from "./subscriber-management-fixture.mjs";

/** Exercise issued authority through anonymous HTTP, never service methods. */
export async function subscriberTokenAuthorityFlow() {
  const secret = "synthetic-lamp-token-authority-1".repeat(4);
  const fixture = await openSubscriberManagementFixture({ extraBindings: { SUBSCRIBER_TOKEN_SECRET: secret } });
  try {
    const { raw, db } = fixture;
    const first = await fixture.createComponent("Synthetic Lamp token first component");
    const second = await fixture.createComponent("Synthetic Lamp token second component");
    const form = (path, values) => raw(path, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: pageOrigin },
      body: new URLSearchParams(values).toString(),
    });
    const inventory = async () => ({
      listed: (await fixture.list()).sort((a, b) => a.id.localeCompare(b.id)),
      subscribers: (await db.prepare("SELECT * FROM subscribers ORDER BY id").all()).results,
      tokens: (await db.prepare("SELECT * FROM subscriber_tokens ORDER BY id").all()).results,
      selections: (await db.prepare("SELECT * FROM subscriber_components ORDER BY id").all()).results,
      components: (await db.prepare("SELECT * FROM components ORDER BY id").all()).results,
    });
    const except = (state, id) => ({
      listed: state.listed.filter(row => row.id !== id),
      subscribers: state.subscribers.filter(row => row.id !== id),
      tokens: state.tokens.filter(row => row.subscriber_id !== id),
      selections: state.selections.filter(row => row.subscriber_id !== id),
      components: state.components,
    });
    const protect = response => {
      assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
      assert.equal(response.headers.get("X-Robots-Tag"), "noindex");
      assert.equal(response.headers.get("Set-Cookie"), null);
    };
    const tokenOf = link => decodeURIComponent(new URL(link).pathname.split("/").at(-1));
    const linkIn = (text, door) => {
      const link = text.match(new RegExp(`https?://\\S+/${door}/[^\\s"<>]+`))?.[0];
      assert.ok(link, `the real mail or management form contains ${door}`);
      return new URL(link, pageOrigin).href;
    };
    const issue = async index => {
      const email = `synthetic-lamp-token-${index}${String.fromCharCode(64)}${new URL(pageOrigin).hostname}`;
      const response = await form(`${pageOrigin}/subscribe`, { email, componentId: first.id });
      assert.equal(response.status, 202, await response.text());
      const message = fixture.messagesFor(email)[0];
      assert.ok(message, "the real provider edge received the confirmation email");
      const row = (await fixture.list()).find(item => item.destination === email);
      assert.equal(row.state, "pending");
      return { email, id: row.id, confirm: linkIn(message.text, "confirm-subscription"), unsubscribe: linkIn(message.text, "unsubscribe") };
    };
    const activate = async control => {
      const response = await raw(control.confirm);
      assert.equal(response.status, 200, await response.text());
      protect(response);
      assert.equal((await fixture.list()).find(row => row.id === control.id).state, "active");
      assert.equal((await form(`${pageOrigin}/subscribe`, { email: control.email })).status, 202);
      const mail = fixture.messagesFor(control.email).find(message => message.text.includes("/manage/"));
      assert.ok(mail, "the active subscriber receives an actual management link");
      control.manage = linkIn(mail.text, "manage");
      const managed = await raw(control.manage);
      assert.equal(managed.status, 200);
      protect(managed);
      const html = await managed.text();
      const unsubscribe = html.match(/action="(\/unsubscribe\/[^"<>]+)"/)?.[1];
      assert.ok(unsubscribe, "the real management form carries unsubscribe authority");
      assert.equal(tokenOf(new URL(unsubscribe, pageOrigin)), tokenOf(control.unsubscribe));
    };
    const owner = await issue(1);
    const unrelated = await issue(2);
    const pending = await issue(3);
    await activate(owner);
    await activate(unrelated);

    // Independently reconstruct the complete authenticator, including its
    // domain, scope and token-record identity. Length alone is not entropy proof.
    for (const control of [owner, unrelated, pending]) {
      for (const scope of ["confirm", "manage", "unsubscribe"]) {
        const row = await db.prepare("SELECT * FROM subscriber_tokens WHERE subscriber_id = ? AND scope = ?").bind(control.id, scope).first();
        assert.ok(row, `issuance persisted ${scope} for this subscription`);
        const token = control[scope] ? tokenOf(control[scope]) : `v1.${scope}.${row.id}.${createHmac("sha256", secret).update(`lamp-subscriber-token.v1.${scope}.${row.id}`).digest("base64url")}`;
        const [version, tokenScope, id, signature] = token.split(".");
        assert.equal(version, "v1");
        assert.equal(tokenScope, scope);
        assert.equal(id, row.id);
        const expected = createHmac("sha256", secret).update(`lamp-subscriber-token.v1.${scope}.${id}`).digest();
        assert.equal(expected.length, 32);
        assert.deepEqual(Buffer.from(signature, "base64url"), expected, "issued authority retains all 256 HMAC-SHA256 bits");
        assert.equal(signature, expected.toString("base64url"), "authenticator is not truncated or padded");
        assert.equal(row.token_hash, createHash("sha256").update(token).digest("base64url"));
      }
    }

    const beforeSave = await inventory();
    const saved = await form(owner.manage, { componentId: second.id });
    assert.equal(saved.status, 200, await saved.text());
    const afterSave = await fixture.list();
    assert.deepEqual(afterSave.find(row => row.id === owner.id).componentSelections.map(row => row.componentId), [second.id]);
    assert.deepEqual(except(await inventory(), owner.id), except(beforeSave, owner.id), "valid management edits only its own subscription");
    const readback = await raw(owner.manage);
    assert.equal(readback.status, 200);
    assert.ok((await readback.text()).includes(`value="${second.id}" checked`), "the anonymous management door retains the saved selection");

    const refusedBefore = await inventory();
    const attempt = async (token, scope) => {
      const path = `${pageOrigin}/${scope === "confirm" ? "confirm-subscription" : scope}/${token}`;
      const response = scope === "confirm" ? await raw(path) : await form(path, scope === "manage" ? { componentId: first.id } : { action: "unsubscribe" });
      assert.equal(response.status, 404, `${scope} refuses substituted or tampered authority`);
      protect(response);
    };
    for (const scope of ["confirm", "manage", "unsubscribe"]) {
      const token = tokenOf(owner[scope]);
      for (const otherScope of ["confirm", "manage", "unsubscribe"].filter(value => value !== scope)) {
        await attempt(token, otherScope);
        const substituted = token.split(".");
        substituted[1] = otherScope;
        await attempt(substituted.join("."), otherScope);
      }
      const otherTokenId = tokenOf(unrelated[scope]).split(".")[2];
      for (const id of [otherTokenId, unrelated.id]) {
        const substituted = token.split(".");
        substituted[2] = id;
        await attempt(substituted.join("."), scope);
      }
      const tampered = token.split(".");
      tampered[3] = (tampered[3][0] === "A" ? "B" : "A") + tampered[3].slice(1);
      await attempt(tampered.join("."), scope);
      for (const [path, method] of [["/api/app/subscribers", "GET"], [`/api/app/subscribers/${unrelated.id}`, "DELETE"], ["/api/app/components", "POST"]]) {
        const response = await raw(`${path}?token=${encodeURIComponent(token)}`, {
          method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Origin: fixture.appOrigin },
          ...(method === "POST" ? { body: JSON.stringify({ groupId: null, name: "Synthetic Lamp forbidden component", description: "", internal: false, displayOrder: 1, note: "" }) } : {}),
        });
        assert.equal(response.status, 401, "subscriber authority never becomes an operator session");
        assert.equal(response.headers.get("Set-Cookie"), null);
      }
    }
    assert.deepEqual(await inventory(), refusedBefore, "every refusal preserves all subscriptions, issued tokens and component selections");

    // Confirm was previously exercised on the active control; unsubscribe and
    // manage are still live at deletion. Pending confirmation remains unspent.
    for (const control of [pending, owner]) {
      const beforeDelete = await inventory();
      const tokens = beforeDelete.tokens.filter(row => row.subscriber_id === control.id);
      assert.deepEqual(tokens.filter(row => row.revoked_at === null).map(row => row.scope).sort(), control === pending ? ["confirm", "manage", "unsubscribe"] : ["manage", "unsubscribe"]);
      const preview = await raw(control.unsubscribe);
      assert.equal(preview.status, 200);
      protect(preview);
      const deleted = await fixture.api(`/api/app/subscribers/${control.id}`, { method: "DELETE" });
      assert.equal(deleted.status, 204, deleted.text);
      const afterDelete = await inventory();
      const erased = afterDelete.listed.find(row => row.id === control.id);
      assert.equal(erased.state, "deactivated");
      assert.equal(erased.destination, `deleted:${control.id}`);
      assert.equal(erased.deactivationReason, "deleted by operator");
      const remaining = afterDelete.tokens.filter(row => row.subscriber_id === control.id);
      assert.deepEqual(remaining.map(row => row.id), tokens.map(row => row.id));
      assert.ok(remaining.every(row => row.revoked_at !== null), "deletion revokes every issued scope, including unexposed pending management authority");
      for (const scope of ["confirm", "manage", "unsubscribe"]) {
        const row = tokens.find(row => row.scope === scope);
        const token = control[scope] ? tokenOf(control[scope]) : `v1.${scope}.${row.id}.${createHmac("sha256", secret).update(`lamp-subscriber-token.v1.${scope}.${row.id}`).digest("base64url")}`;
        await attempt(token, scope);
        if (scope === "manage") assert.equal((await raw(`${pageOrigin}/manage/${token}`)).status, 404, "deletion also revokes management reads");
      }
      assert.deepEqual(await inventory(), afterDelete, "deleted-token replay cannot restore or modify any subscription");
      assert.deepEqual(except(afterDelete, control.id), except(beforeDelete, control.id), "deletion preserves every unrelated subscription and its tokens");
    }
    const beforeUnsubscribe = await inventory();
    assert.equal((await raw(unrelated.manage)).status, 200, "an unrelated management link still works after both deletions");
    const unsubscribed = await form(unrelated.unsubscribe, { action: "unsubscribe" });
    assert.equal(unsubscribed.status, 200, await unsubscribed.text());
    protect(unsubscribed);
    const stopped = await inventory();
    assert.equal(stopped.listed.find(row => row.id === unrelated.id).state, "deactivated");
    assert.deepEqual(except(stopped, unrelated.id), except(beforeUnsubscribe, unrelated.id));
    assert.ok(stopped.tokens.filter(row => row.subscriber_id === unrelated.id).every(row => row.revoked_at !== null));
    for (const scope of ["confirm", "manage", "unsubscribe"]) await attempt(tokenOf(unrelated[scope]), scope);
    assert.equal((await raw(unrelated.manage)).status, 404);
    assert.deepEqual(await inventory(), stopped, "deactivation also revokes every old link without resurrection");
  } finally { await fixture.close(); }
}
