import assert from "node:assert/strict";
import { openSubscriberManagementFixture } from "./subscriber-management-fixture.mjs";

/** Real migrated Worker, native token issuance and incident subscriber doors;
 * only the fixture's outbound email provider is replaced. */
export async function incidentSubscriptionApiFlow() {
  const address=name=>["synthetic-lamp-"+name,"example.test"].join("@");
  const outbound=[];
  const fixture=await openSubscriberManagementFixture({providerEdge:request=>{outbound.push(request.url);}});
  const {post,api,raw,appOrigin,db,messages}=fixture;
  try {
    const component=await post("/api/app/components",{name:"Incident API",groupId:null,description:"",internal:false,displayOrder:0,note:""});
    assert.equal(component.status,201,component.text);
    const {incident}=await fixture.publish(component.body.component,"Follow this incident");
    const {incident:other}=await fixture.publish(component.body.component,"Another incident");
    const mint=async scopes=>{
      const result=await post("/api/app/management-tokens",{name:"Incident subscriber integration",scopes,expiresInSeconds:3600});
      assert.equal(result.status,201,result.text);return result.body;
    };
    const writer=await mint(["subscribers:write"]),reader=await mint(["subscribers:read"]),publicReader=await mint(["read"]),unscoped=await mint([]);
    const path=`/api/v1/incidents/${incident.id}/subscribers`,compat=`/v1/pages/default/incidents/${incident.id}/subscribers`;
    const call=(path,token,method="GET",body,oauth=false)=>raw(appOrigin+path,{method,headers:{Authorization:`${oauth?"OAuth":"Bearer"} ${token}`,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const state=async()=>({subscribers:(await db.prepare("SELECT * FROM subscribers ORDER BY id").all()).results,incident:(await db.prepare("SELECT * FROM incident_subscriptions ORDER BY subscriber_id").all()).results,tokens:(await api("/api/app/management-tokens")).body.tokens,audit:(await db.prepare("SELECT * FROM audit_entries ORDER BY id").all()).results,messages:messages.length});
    assert.equal((await call("/api/v1/components",publicReader.token)).status,200,"existing public read tokens retain public component access");
    const before=await state();
    assert.equal((await call(path,publicReader.token)).status,403,"an existing public-data read scope does not expose subscriber addresses");
    assert.equal((await call("/api/v1/components",reader.token)).status,403,"a subscriber reader gains no unrelated read permission");
    assert.equal((await call(path,reader.token,"POST",{channel:"email",email:address("denied")})).status,403);
    assert.equal((await call(compat,unscoped.token,"POST",{subscriber:{email:address("denied")}},true)).status,403);
    assert.equal((await call(path,writer.token)).status,403,"write scope does not grant address listing");
    assert.deepEqual(await state(),before,"scope refusals change no subscriber, audit, usage or outbound mail");
    const beforeUnsafe=await fixture.databaseState(),mailBeforeUnsafe=messages.length,outboundBeforeUnsafe=outbound.length;
    const unsafeDestinations=["https://[::1]/synthetic-lamp-1","https://[::ffff:127.0.0.1]/x","https://[::ffff:7f00:1]/x","https://[fc00::]/x",
      "https://[64:ff9b::7f00:1]/x","https://[64:ff9b:1::7f00:1]/x","https://[2002:7f00:1::]/x","https://[::127.0.0.1]/x","https://[::7f00:1]/x",
      "https://localhost./x","https://foo.localhost./x","https://[fec0::1]/x","https://[ff02::1]/x","https://[2001:db8::1]/x","https://[2001::1]/x",
      "https://[::ffff:100.64.0.1]/x","https://100.64.0.1/x","https://198.18.0.1/x","https://192.0.0.1/x","https://224.0.0.1/x",
      "https://[::ffff:0:7f00:1]/x","https://[::ffff:0:a00:1]/x","https://localhost../x"];
    for(const destination of unsafeDestinations) {
      const refused=await call(path,writer.token,"POST",{channel:"webhook",destination,contactEmail:address("unsafe-webhook")});
      assert.equal(refused.status,400,`${destination}: ${await refused.text()}`);
    }
    const publicRefused=await raw(fixture.publicOrigin+"/subscribe/incident",{method:"POST",headers:{Origin:fixture.publicOrigin,"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({incidentId:incident.id,channel:"webhook",destination:"https://[::1]/synthetic-lamp-1",contactEmail:address("unsafe-public-webhook")}).toString()});
    assert.equal(publicRefused.status,400,await publicRefused.text());
    for(const destination of unsafeDestinations.slice(4)) {
      const refusedPublic=await raw(fixture.publicOrigin+"/subscribe/incident",{method:"POST",headers:{Origin:fixture.publicOrigin,"Content-Type":"application/x-www-form-urlencoded","CF-Connecting-IP":"203.0.113."+(unsafeDestinations.indexOf(destination)+1)},body:new URLSearchParams({incidentId:incident.id,channel:"webhook",destination,contactEmail:address("unsafe-public-webhook")}).toString()});
      assert.equal(refusedPublic.status,400,`${destination}: ${await refusedPublic.text()}`);
    }
    const afterUnsafe=await fixture.databaseState();
    // Refused public writes still consume their existing abuse-control allowance.
    beforeUnsafe.delete("request_rate_windows");afterUnsafe.delete("request_rate_windows");
    assert.deepEqual(afterUnsafe,beforeUnsafe,"unsafe webhook refusals preserve every business table");
    assert.equal(messages.length,mailBeforeUnsafe,"unsafe webhook requests send no mail");
    assert.equal(outbound.length,outboundBeforeUnsafe,"unsafe webhook requests contact no endpoint");
    const safe=await call(path,writer.token,"POST",{channel:"webhook",destination:"https://receiver.example.test/synthetic-lamp-1",contactEmail:address("public-webhook")});
    assert.equal(safe.status,201,await safe.clone().text());
    const safeId=(await safe.json()).subscriberId;
    assert.ok((await fixture.list()).some(row=>row.id===safeId&&row.state==="pending"));
    assert.equal(fixture.messagesFor(address("public-webhook")).length,1,"a public HTTPS destination still receives confirmation");
    assert.equal((await call(`${path}/${safeId}`,writer.token,"DELETE")).status,204);
    for(const [index,destination] of ["https://[2606:4700:4700::1111]/synthetic-lamp-2","https://[2001:4860:4860::8888]/synthetic-lamp-3"].entries()) {
      const publicV6=await call(path,writer.token,"POST",{channel:"webhook",destination,contactEmail:address("public-v6-"+index)});
      assert.equal(publicV6.status,201,`${destination}: ${await publicV6.clone().text()}`);
      assert.equal((await call(`${path}/${(await publicV6.json()).subscriberId}`,writer.token,"DELETE")).status,204);
    }
    const created=await call(path,writer.token,"POST",{channel:"email",email:address("native-incident"),includeReport:false});
    assert.equal(created.status,201,await created.clone().text());
    const native=await created.json();
    const listed=await call(path,reader.token);
    assert.equal(listed.status,200);assert.equal(listed.headers.get("cache-control"),"no-store");
    const rows=(await listed.json()).subscribers;
    assert.ok(rows.some(row=>row.id===native.subscriberId&&row.destination===address("native-incident")&&row.state==="pending"&&row.incident.includeReport===false));
    const compatibilityCreated=await call(compat,writer.token,"POST",{subscriber:{email:address("compat-incident"),mode:"email"}},true);
    assert.equal(compatibilityCreated.status,201,await compatibilityCreated.clone().text());
    const compatible=await compatibilityCreated.json();
    const compatibilityList=await call(compat,reader.token,"GET",undefined,true);
    assert.equal(compatibilityList.status,200);
    assert.ok((await compatibilityList.json()).some(row=>row.id===compatible.id&&row.email===address("compat-incident")&&row.pending));
    const beforeWrongIncident=await state();
    assert.equal((await call(`/api/v1/incidents/${other.id}/subscribers/${native.subscriberId}`,writer.token,"DELETE")).status,404);
    assert.deepEqual(await state(),beforeWrongIncident,"an incident cannot delete another incident's follower");
    assert.equal((await call(`${compat}/${compatible.id}`,writer.token,"DELETE",undefined,true)).status,204);
    assert.equal((await call(`${path}/${native.subscriberId}`,writer.token,"DELETE")).status,204);
    const emptied=await call(path,reader.token);assert.deepEqual((await emptied.json()).subscribers,[]);
    const erasedState=await state();
    assert.ok(!JSON.stringify(erasedState).includes(address("native-incident")),"deletion retains no native subscriber address in product records");
    const captured=messages.find(message=>message.to.includes(address("native-incident"))&&message.text.includes("/confirm-subscription/"));
    assert.ok(captured,"the journey captured a real issued confirmation before erasure");
    const capturedLinks=[...captured.text.matchAll(/https?:\/\/\S+\/(?:confirm-subscription|manage)\/\S+/g)].map(match=>match[0]);
    assert.ok(capturedLinks.length>=2);
    for(const link of capturedLinks)assert.equal((await raw(link)).status,404,"erasure revokes captured confirmation and management authority");
    assert.deepEqual(await state(),erasedState,"replaying captured authority cannot resurrect an erased incident follower");
    assert.equal((await post(`/api/app/management-tokens/${writer.credential.id}/revoke`,{})).status,200);
    const revoked=await state();
    assert.equal((await call(compat,writer.token,"POST",{subscriber:{email:address("revoked")}},true)).status,401);
    assert.equal((await call(`${path}/${native.subscriberId}`,writer.token,"DELETE")).status,401);
    assert.deepEqual(await state(),revoked,"revoked tokens change no records, usage or outgoing mail");
  } finally {await fixture.close();}
}
